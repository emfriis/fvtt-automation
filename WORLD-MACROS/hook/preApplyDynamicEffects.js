// preApplyDynamicEffects

function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users.find(u => u.data.character === actor.id && u.active);
	if (!user) user = game.users.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users.find(p => p.isGM && p.active);
	return user;
}

Hooks.on("midi-qol.preApplyDynamicEffects", async (workflow) => {
	try {

        const targets = Array.from(workflow.targets);
        for (let t = 0; t < targets.length; t++) {
            let token = targets[t];
            let tactor = token.actor;
		    if (!tactor) continue;

            // thorns 
            // range(int[range]),damageDice(str[rollable]),damageType(str[damage]),magicEffect(str["magiceffect"] or null),spellEffect(str["magiceffect"] or null),saveDC(int[dc] or null),saveType(str[abil] or null),saveDamage(str["nodam","halfdam","fulldam"] or null)
            if (tactor.data.flags["midi-qol"].thorns && ["mwak","msak"].includes(workflow.item.data.data.actionType) && workflow.hitTargets.has(token)) {
                try {
                    console.warn("Thorns activated");
                    const effects = tactor.effects.filter(e => e.data.changes.find(c => c.key === "flags.midi-qol.thorns"));
                    for (let e = 0; e < effects.length; e++) {
                        const thorns = effects[e].data.changes.find(c => c.key === "flags.midi-qol.thorns").value.split(",");
                        if (MidiQOL.getDistance(token, workflow.token, false) <= parseInt(thorns[0])) {
                            const applyDamage = game.macros.find(m => m.name === "ApplyDamage");
                            if (applyDamage) await applyDamage.execute("ApplyDamage", tactor.uuid, workflow.tokenUuid, thorns[1], thorns[2], thorns[3], thorns[4], thorns[5], thorns[6]);
                        }
                    }
                } catch (err) {
                    console.error("Thorns error", err);
                }
            }
        }

        let attackWorkflow;
        if (workflow.damageList) attackWorkflow = workflow.damageList.map((d) => ({ tokenUuid: d.tokenUuid, appliedDamage: d.appliedDamage, newHP: d.newHP, oldHP: d.oldHP, newTemp: d.newTemp, oldTemp: d.oldTemp, damageDetail: d.damageDetail }));
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
                if (tactor.data.flags["midi-qol"].noRegen && attackWorkflow[a].appliedDamage > 0) {
                    try {
                        console.warn("No Regen activated");
                        let noRegenTypes = tactor.data.flags["midi-qol"]?.noRegen?.split(",");
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

                // armor of agathys
                if (tactor.effects.find(e => e.data.label === "Armor of Agathys")) {
                    try {
                        console.warn("Armor of Agathys activated");
                        if (tactor.data.data.attributes.hp.temp === 0 || (attackWorkflow[a].newTemp > attackWorkflow[a].oldTemp)) {
                            let effect = tactor.effects.find(e => e.data.label === "Armor of Agathys");
                            if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                            console.warn("Armor of Agathys used");
                        }
                    } catch(err) {
                        console.error("Armor of Agathys error", err);
                    }
                }

                // damaged attempt removal
                // spelldc,abil/save,type,advantage
                if (tactor.data.flags["midi-qol"].damagedattemptremoval && attackWorkflow[a].appliedDamage > 0) {
                    try {
                        console.warn("Damaged Attempt Removal activated");
                        const effects = tactor.effects.filter(e => e.data.changes.find(c => c.key === "flags.midi-qol.damagedAttemptRemoval"));
                        for (let e = 0; e < effects.length; e++) {
                            const removalData = effects[e].data.changes.find(c => c.key === "flags.midi-qol.damagedAttemptRemoval").value.split(",");
                            const condition = effects[e].data.label;
                            const origin = await fromUuid(effects[e].data.origin);
                            let getResist = false;
                            if (removalData[1] === "save" && removalData[3] !== "advantage") {
                                let resist = [];
                                switch(condition) {
                                    case "Blinded":
                                        resist.push("Blindness Resilience");
                                        break;
                                    case "Charmed": 
                                        resist.push("Fey Ancestry", "Duergar Reslience", "Charm Resilience");
                                        break;
                                    case "Deafened":
                                        resist.push("Deafness Resilience");
                                        break;
                                    case "Frightened":
                                        resist.push("Brave", "Fear Resilience");
                                        break;
                                    case "Grappled":
                                        resist.push("Grapple Resilience");
                                        break;
                                    case "Incapacitated":
                                        resist.push("Incapacitation Resilience");
                                        break;
                                    case "Paralyzed":
                                        resist.push("Duergar Resilience", "Paralysis Resilience");
                                        break;
                                    case "Poisoned":
                                        resist.push("Dwarven Resilience", "Duergar Resilience", "Stout Resilience", "Poison Resilience");
                                        break;
                                    case "Prone":
                                        resist.push("Sure-Footed", "Prone Resilience");
                                        break;
                                    case "Restrained":
                                        resist.push("Restraint Resilience");
                                        break;
                                    case "Stunned":
                                        resist.push("Stun Resilience");
                                }
                                if (origin?.data?.type === "spell") {
                                    resist.push("Spell Resilience", "Spell Resistance", "Magic Resilience", "Magic Resistance");
                                } else if (origin?.data?.data?.properties?.mgc || origin?.data?.flags?.midiProperties?.magiceffect) {
                                    resist.push("Magic Resilience", "Magic Resistance");
                                }
                                getResist = tactor.items.find(i => resist.includes(i.name)) || tactor.effects.find(i => resist.includes(i.data.label));
                            }
                            const player = await playerForActor(tactor);
                            const rollOptions = getResist || removalData[3] === "advantage" ? { chatMessage: true, fastForward: true, advantage: true } : { chatMessage: true, fastForward: true };
                            const roll = await MidiQOL.socket().executeAsUser("rollAbility", player.id, { request: removalData[1], targetUuid: tactor.uuid, ability: removalData[2], options: rollOptions }); 
                            if (game.dice3d) game.dice3d.showForRoll(roll);
                            if (roll.total >= removalData[0]) {
                                await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effects[e].id] });
                                ChatMessage.create({ content: `The afflicted creature passes the roll and removes the ${condition} condition.` });
                            } else {
                                if (roll.total < removalData[0]) ChatMessage.create({ content: `The afflicted creature fails the roll and still has the ${condition} condition.` });
                            }
                            console.warn("Damaged Attempt Removal used");
                        }
                    } catch(err) {
                        console.error("Damaged Attempt Removal error", err);
                    }
                }
            }
        }
	} catch(err) {
        console.error("preApplyDynamicEffects Error", err);
    }
});