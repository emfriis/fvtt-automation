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
                            if (applyDamage) await applyDamage.execute("ApplyDamage", token.id, workflow.tokenId, thorns[1], thorns[2], thorns[3], thorns[4], thorns[5], thorns[6]);
                        }
                    }
                } catch (err) {
                    console.error("Thorns error", err);
                }
            }
        }

        if (workflow.damageList) {
            for (let d = 0; d < workflow.damageList.length; d++) {
                let token = canvas.tokens.get(workflow.damageList[d].tokenId);
                let tokenOrActor = await fromUuid(workflow.damageList[d].actorUuid)
                let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
		        if (!tactor) continue;

                // rage
                if (workflow.damageList[d].appliedDamage > 0 && tactor.data.flags["midi-qol"]?.rage) {
                    try {
                        console.warn("Rage activated");
                        const rollData = tactor.getRollData();
                        const barbarian = rollData.details?.cr ?? rollData?.classes?.barbarian?.levels;
                        if (barbarian && barbarian < 15) {
                            if (!tactor.data.flags["midi-qol"]?.rageDamaged) await tactor.setFlag("midi-qol", "rageDamaged", true);
                            console.warn("Rage Damaged used");
                        } 
                        if (barbarian && barbarian >= 11 && tactor.data.data.attributes.hp.value === 0 && workflow.damageList[d].oldHP !== 0 && workflow.damageList[d].newHP === 0) {
                            const relentlessDC = getProperty(tactor.data.flags, "midi-qol.relentlessDC") ?? 10;
                            let player = await playerForActor(tactor);
                            let useFeat = false;
                            useFeat = await USF.socket.executeAsUser("useDialog", player.id, { title: `Relentless Rage`, content: `Use Relentless Rage to survive grievous wounds?` });
                            if (useFeat) {
                                const itemData = {
                                    name: `Relentless Rage Save`,
                                    img: `icons/skills/social/intimidation-impressing.webp`,
                                    type: "feat",
                                    data: {
                                        activation: { type: "none", },
                                        target: { type: "self", },
                                        actionType: "save",
                                        save: { dc: relentlessDC, ability: "con", scaling: "flat" },
                                    }
                                }
                                await USF.socket.executeAsGM("createItem", { actorUuid: tactor.uuid, itemData: itemData });
                                let saveItem = await tactor.items.find(i => i.name === itemData.name);
                                let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
                                await USF.socket.executeAsGM("deleteItem", { itemUuid: saveItem.uuid });
                                if (!saveWorkflow.failedSaves.size) {
                                    await USF.socket.executeAsGM("updateActor", { actorUuid: tactor.uuid, updates: {"data.attributes.hp.value" : 1} });
                                    let relentless = tactor.effects.find(i => i.data.label === "Relentless Rage DC");
                                    if (relentless) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [relentless.id] });
                                    const effectData2 = {
                                        changes: [{ key: "flags.midi-qol.relentlessDC", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: `${relentlessDC + 5}`, priority: 20 }],
                                        disabled: false,
                                        flags: { dae: { specialDuration: ["shortRest", "longRest"] } },
                                        label: "Relentless Rage DC",
                                    };
                                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData2] });
                                    let effect = tactor.effects.find(i => i.data.label === "Unconscious");
                                    if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                                }
                                console.warn("Relentless Rage used");
                            }
                        }
                    } catch(err) {
                        console.error("Rage error", err);
                    }
                }   

                // undead fortitude
                if (tactor.data.data.attributes.hp.value === 0 && workflow.damageList[d].oldHP !== 0 && workflow.damageList[d].newHP === 0 && tactor.data.flags["midi-qol"].undeadFortitude) {
                    try {
                        console.warn("Undead Fortitude activated");
                            if (!workflow.damageList[d].damageDetail.find(d => Array.isArray(d) && d[0].type === "radiant") && !workflow.isCritical) {
                                const itemData = {
                                    name: `Undead Fortitude Save`,
                                    img: `icons/magic/acid/pouring-gas-smoke-liquid.webp`,
                                    type: "feat",
                                    data: {
                                        activation: { type: "none", },
                                        target: { type: "self", },
                                        actionType: "save",
                                        save: { dc: workflow.damageList[d].appliedDamage + 5, ability: "con", scaling: "flat" },
                                    }
                                }
                                await USF.socket.executeAsGM("createItem", { actorUuid: tactor.uuid, itemData: itemData });
                                let saveItem = await tactor.items.find(i => i.name === itemData.name);
                                let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
                                await USF.socket.executeAsGM("deleteItem", { itemUuid: saveItem.uuid });
                                if (!saveWorkflow.failedSaves.size) await USF.socket.executeAsGM("updateActor", { actorUuid: tactor.uuid, updates: {"data.attributes.hp.value" : 1} });
                            console.warn("Undead Fortitude used");
                        }
                    } catch(err) {
                        console.error("Undead Fortitude error", err);
                    }
                }

                // relentless
                if (tactor.data.data.attributes.hp.value === 0 && workflow.damageList[d].oldHP !== 0 && workflow.damageList[d].newHP === 0 && tactor.data.flags["midi-qol"].relentless) {
                    try {
                        console.warn("Relentless activated");
                        let featItem = await tactor.items.find(i => i.name === "Relentless");
                        let damageThreshold = parseInt(tactor.data.flags["midi-qol"].relentless) ?? Math.ceil(tactor.data.data.details?.cr * 2 + 6);
                        if (featItem && featItem.data.data.uses.value && featItem.data.data.uses.value > 0 && damageThreshold && workflow.damageList[d].appliedDamage <= damageThreshold) {
                            await USF.socket.executeAsGM("updateActor", { actorUuid: tactor.uuid, updates: {"data.attributes.hp.value" : 1} });
                            await USF.socket.executeAsGM("updateItem", { itemUuid: featItem.uuid, updates: {"data.uses.value" : featItem.data.data.uses.value - 1} });
                            console.warn("Relentless used");
                        }
                    } catch(err) {
                        console.error("Relentless error", err);
                    }
                }

                // relentless endurance
                if (tactor.data.data.attributes.hp.value === 0 && workflow.damageList[d].oldHP !== 0 && workflow.damageList[d].newHP === 0 && tactor.data.flags["midi-qol"].relentlessEndurance) {
                    try {
                        console.warn("Relentless Endurance activated");
                        let featItem = await tactor.items.find(i => i.name === "Relentless Endurance");
                        let player = await playerForActor(tactor);
                        let useFeat = false;
                        if (featItem && featItem.data.data.uses.value && socket) useFeat = await socket.executeAsUser("useDialog", player.id, { title: `Relentless Endurance`, content: `Use Relentless Endurance to survive grievous wounds?` });
                        if (useFeat) {
                            await USF.socket.executeAsGM("updateActor", { actorUuid: tactor.uuid, updates: {"data.attributes.hp.value" : 1} });
                            await USF.socket.executeAsGM("updateItem", { itemUuid: featItem.uuid, updates: {"data.uses.value" : featItem.data.data.uses.value - 1} });
                            let effect = tactor.effects.find(i => i.data.label === "Unconscious");
                            if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                            console.warn("Relentless Endurance used");
                        }
                    } catch(err) {
                        console.error("Relentless Endurance error", err);
                    }
                }

                // no regen
                if (tactor.data.flags["midi-qol"].noRegen && workflow.damageList[d].appliedDamage > 0) {
                    try {
                        console.warn("No Regen activated");
                        let noRegenTypes = tactor.data.flags["midi-qol"]?.noRegen?.split(",");
                        if (noRegenTypes) {
                            let damageDetail = workflow.damageList[d].damageDetail;
                            for (let i = 0; i < damageDetail?.length; i++) {
                                for (let p = 0; p < damageDetail[i]?.length; p++) {
                                    if (noRegenTypes.includes(damageDetail[i][p]?.type)) {
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
                if (tactor.data.flags["midi-qol"].armorOfAgathys) {
                    try {
                        console.warn("Armor of Agathys activated");
                        if (tactor.data.data.attributes.hp.temp === 0 || (workflow.damageList[d].newTemp > workflow.damageList[d].oldTemp)) {
                            let effect = tactor.effects.find(e => e.data.label === "Armor of Agathys");
                            if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                            console.warn("Armor of Agathys used");
                        }
                    } catch(err) {
                        console.error("Armor of Agathys error", err);
                    }
                }

                // elemental bane
                if (tactor.data.flags["midi-qol"].elementalBane && workflow.damageList[d].appliedDamage > 0 && !tactor.data.data.traits.di.value.includes(tactor.data.flags["midi-qol"].elementalBane?.toLowerCase())) {
                    try {
                        console.warn("Elemental Bane activated");
                        if (game.combat && tactor.data.flags["midi-qol"].baneTime !== `${game.combat.id}-${game.combat.round + game.combat.turn / 100}` && workflow.damageList[d].damageDetail.find(d => Array.isArray(d) && d[0].type === tactor.data.flags["midi-qol"].elementalBane?.toLowerCase())) {
                            await tactor.setFlag("midi-qol", "baneTime", `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`);
                            const applyDamage = game.macros.find(m => m.name === "ApplyDamage");
                            if (applyDamage) await applyDamage.execute("ApplyDamage", tactor?.token?.id, token.id, "2d6", tactor.data.flags["midi-qol"].elementalBane?.toLowerCase(), "magiceffect", "spelleffect");
                            console.warn("Elemental Bane used");
                        }
                    } catch(err) {
                        console.error("Elemental Bane error", err);
                    }
                }

                // damaged attempt removal
                // spelldc,abil/save,type,advantage
                if (tactor.data.flags["midi-qol"].damagedAttemptRemoval && workflow.damageList[d].appliedDamage > 0) {
                    try {
                        console.warn("Damaged Attempt Removal activated");
                        const effects = tactor.effects.filter(e => e.data.changes.find(c => c.key === "flags.midi-qol.damagedAttemptRemoval"));
                        for (let e = 0; e < effects.length; e++) {
                            const removalData = effects[e].data.changes.find(c => c.key === "flags.midi-qol.damagedAttemptRemoval").value.split(",");
                            const condition = effects[e].data.label;
                            const icon = effects[e].data.icon;
                            if (effects[e].data.origin) origin = await fromUuid(effects[e].data.origin);
                            const magicEffect = origin?.data?.data?.properties?.mgc || origin?.data?.flags?.midiProperties?.magiceffect || effects[e].data?.flags?.magiceffect;
                            const spellEffect = origin?.data?.type === "spell" || effects[e].data?.flags?.spelleffect;
                            if (removalData[3]) {
                                if (removalData[1] === "save") {
                                    let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
                                        if (actor === tactor && abilityId === removalData[2]) {
                                            rollData.advantage = true;
                                            Hooks.off("Actor5e.preRollAbilitySave", hook);
                                        }
                                    });
                                } else if (removalData[1] === "abil") {
                                    let hook = Hooks.on("Actor5e.preRollAbilityCheck", async (actor, rollData, abilityId) => {
                                        if (actor === tactor && abilityId === removalData[2]) {
                                            rollData.advantage = true;
                                            Hooks.off("Actor5e.preRollAbilityCheck", hook);
                                        }
                                    });
                                }
                            }
                            const itemData = {
                                name: `${condition} Save`,
                                img: icon,
                                type: "feat",
                                flags: {
                                    midiProperties: { magiceffect: (magicEffect ? true : false), spelleffect: (spellEffect ? true : false), }
                                },
                                data: {
                                    activation: { type: "none", },
                                    target: { type: "self", },
                                    actionType: removalData[1],
                                    ability: removalData[2],
                                    save: { dc: removalData[0], ability: removalData[2], scaling: "flat" },
                                }
                            }
                            await USF.socket.executeAsGM("createItem", { actorUuid: tactor.uuid, itemData: itemData });
                            let saveItem = await tactor.items.find(i => i.name === itemData.name);
                            let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
                            await USF.socket.executeAsGM("deleteItem", { itemUuid: saveItem.uuid });
                            if (!saveWorkflow.failedSaves.size) {
                                await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effects[e].id] });
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