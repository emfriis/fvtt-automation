// preApplyDynamicEffects

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users.find(u => u.data.character === actor.id && u.active);
	if (!user) user = game.users.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users.find(p => p.isGM && p.active);
	return user;
}

Hooks.on("midi-qol.preApplyDynamicEffects", async (workflow) => {
	try {
        let attackWorkflow;
        if (workflow.damageList) attackWorkflow = workflow.damageList.map((d) => ({ tokenUuid: d.tokenUuid, appliedDamage: d.appliedDamage, newHP: d.newHP, oldHP: d.oldHP, damageDetail: d.damageDetail }));
        if (attackWorkflow) {
            for (let a = 0; a < attackWorkflow.length; a++) {
                let token = await fromUuid(attackWorkflow[a].tokenUuid);
                let tactor = token.actor ? token.actor : token;
		    if (!tactor) continue;

                // undead fortitude
                if (tactor.data.data.attributes.hp.value === 0 && attackWorkflow[a].oldHP !== 0 && attackWorkflow[a].newHP === 0 && tactor.items.find(i => i.name === "Undead Fortitude")) {
                    try {
                        console.warn("Undead Fortitude activated");
                            if (!attackWorkflow[a].damageDetail.find(d => Array.isArray(d) && d[0].type === "radiant") && !workflow.isCritical) {
                                const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: "save", targetUuid: tactor.uuid, ability: "con", options: { chatMessage: true, fastForward: true } });
                                if (game.dice3d) game.dice3d.showForRoll(roll);
                                if (roll.total >= attackWorkflow[a].appliedDamage + 5) tactor.update({"data.attributes.hp.value" : 1});
                            console.warn("Undead Fortitude used");
                        }
                    } catch(err) {
                            console.error("Undead Fortitude error", err);
                        }
                    }

                // relentless
                if (tactor.data.data.attributes.hp.value === 0 && attackWorkflow[a].oldHP !== 0 && attackWorkflow[a].newHP === 0 && tactor.items.find(i => i.name === "Relentless")) {
                    try {
                        console.warn("Relentless activated");
                        let featItem = await tactor.items.find(i => i.name === "Relentless");
                        let damageThreshold = Math.ceil(tactor.data.data.details?.cr * 2 + 6);
                            if (featItem && featItem.data.data.uses.value && featItem.data.data.uses.value > 0 && damageThreshold && attackWorkflow[a].appliedDamage <= damageThreshold) {
                                tactor.update({"data.attributes.hp.value" : 1});
                                featItem.update({"data.uses.value" : featItem.data.data.uses.value - 1});
                            console.warn("Relentless used");
                        }
                    } catch(err) {
                        console.error("Relentless error", err);
                    }
                }

                // relentless endurance
                if (tactor.data.data.attributes.hp.value === 0 && attackWorkflow[a].oldHP !== 0 && attackWorkflow[a].newHP === 0 && tactor.items.find(i => i.name === "Relentless Endurance")) {
                    try {
                        console.warn("Relentless Endurance activated");
                        let featItem = await tactor.items.find(i => i.name === "Relentless Endurance");
                        let player = await playerForActor(tactor);
                                let socket;
                                if (game.modules.get("user-socket-functions").active) socket = socketlib.registerModule("user-socket-functions");
                                let useFeat = false;
                                if (game.modules.get("user-socket-functions").active) useFeat = await socket.executeAsUser("useDialog", player.id, { title: `Relentless Endurance`, content: `Use Relentless Endurance to survive grievous wounds?` });
                                if (useFeat) {
                                tactor.update({"data.attributes.hp.value" : 1});
                                    featItem.update({"data.uses.value" : featItem.data.data.uses.value - 1});
                                    let effect = tactor.effects.find(i => i.data.label === "Unconscious");
                                    if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                            console.warn("Relentless Endurance used");
                                }
                    } catch(err) {
                        console.error("Relentless Endurance error", err);
                    }
                }

                // no regen
                if (tactor.data.flags["midi-qol"].noregen && attackWorkflow[a].appliedDamage !== 0) {
                    try {
                        console.warn("No Regen activated");
                        let noRegenTypes = tactor.data.flags["midi-qol"]?.noregen?.split(",");
                        if (noRegenTypes) {
                            let damageDetail = attackWorkflow[a].damageDetail;
                            for (let d = 0; d < damageDetail?.length; d++) {
                                for (let p = 0; p < damageDetail[d]?.length; p++) {
                                    if (noRegenTypes.includes(damageDetail[d][p]?.type)) {
                                        const effectData = {
                                            disabled: false,
                                            flags: { dae: { specialDuration: ["turnEnd"], "core": { statusId: "No Regen" } } },
                                            label: "No Regen",
                                            icon: "icons/skills/wounds/blood-cells-vessel-red-orange.webp"
                                        }
                                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                                    }
                                }
                            }
                        }
                    } catch (err) {
                        console.error("No Regen error", err);
                    }
                }

                // thorns 
                // range(int[range]),damageDice(str[rollable]),damageType(str[damage]),magicEffect(str["magiceffect"] or null),spellEffect(str["magiceffect"] or null),saveDC(int[dc] or null),saveType(str[abil] or null),saveDamage(str["nodam","halfdam","fulldam"] or null)
                if (tactor.data.flags["midi-qol"].thorns) {
                    try {
                        console.warn("Thorns activated");
                        const thorns = tactor.data.flags["midi-qol"].thorns.split(",");
                            if (["mwak","msak"].includes(workflow.item.data.data.actionType) && MidiQOL.getDistance(token, workflow.token, false) <= parseInt(thorns[0])) {
                                const applyDamage = game.macros.find(m => m.name === "ApplyDamage");
                                if (applyDamage) await applyDamage.execute("ApplyDamage", tactor.uuid, workflow.tokenUuid, thorns[1], thorns[2], thorns[3], thorns[4], thorns[5], thorns[6]);
                            }
                    } catch (err) {
                        console.error("Thorns error", err);
                    }
                }
            }
        }
	} catch(err) {
        console.error("preApplyDynamicEffects Error", err);
    }
});