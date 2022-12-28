// RollComplete

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

async function applyBurst(actor, token, range, damageDice, damageType, saveDC, saveType, saveDamage, magicEffect) {
    const itemData = {
        name: `${damageType.charAt(0).toUpperCase() + damageType.slice(1)} Burst`,
        img: "systems/dnd5e/icons/skills/yellow_15.jpg",
        type: "feat",
        flags: {
            midiProperties: {
            magiceffect: (magicEffect === "magiceffect" ? true : false),
            nodam: (saveDamage === "nodam" ? true : false),
            halfdam: (saveDamage === "halfdam" ? true : false)
            }
        },
        data: {
            "activation.type": "none",
            actionType: (saveDC === "none" ? "other" : "save"),
            damage: { parts: [[damageDice, damageType]] },
            save: { dc: (saveDC === "none" ? null : parseInt(saveDC)), ability: (saveType === "none" ? null : saveType), scaling: "flat" },
            target: { value: null, width: null, units: null, type: "creature" },
        }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: actor });
    const targets = canvas.tokens.placeables.filter(t => (MidiQOL.getDistance(token, t, false) <= parseInt(range))).map(t => t.document.uuid);
    const options = { showFullCard: false, createWorkflow: true, configureDialog: false, targetUuids: targets };
    await MidiQOL.completeItemRoll(item, options);
};

Hooks.on("midi-qol.RollComplete", async (workflow) => {
    try {

        if (workflow.damageList) {
            for (let d = 0; d < workflow.damageList.length; d++) {
                let token = canvas.tokens.get(workflow.damageList[d].tokenId);
                let tokenOrActor = await fromUuid(workflow.damageList[d].actorUuid)
                let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
		        if (!tactor) continue;

                // wild shape
                if (tactor.data.flags["midi-qol"].wildShape && tactor.isPolymorphed && tactor.data.data.attributes.hp.value === 0 && workflow.damageList[d].oldHP !== 0 && workflow.damageList[d].newHP === 0) {
                    try {
                        console.warn("Wild Shape activated");
                        let ogTactor;
                        if (tactor.data.type === "character") {
                            let ogTokenOrActor = await fromUuid(tactor.data.flags["midi-qol"].wildShape);
                            ogTactor = ogTokenOrActor.actor ? ogTokenOrActor.actor : ogTokenOrActor;
                        }
                        const wildShape = tactor.effects.find(e => e.data.label === "Wild Shape");
                        if (wildShape) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [wildShape.id] });
                        if (ogTactor) tactor = ogTactor;
                        await wait(1000);
                        if (tactor.effects.find(e => e.data.label === "Concentrating")) {
                            const effectData = {
                                changes: [{ key: "flags.midi-qol.concentrationSaveBonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 9999, priority: 99, }],
                                disabled: false,
                                label: "Wild Shape Concentration Cleanup",
                                flags: { dae: { specialDuration: ["1Save"] } }
                            }
                            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        }
                        if (workflow.damageList[d].appliedDamage && workflow.damageList[d].appliedDamage > workflow.damageList[d].oldHP) await USF.socket.executeAsGM("updateActor", { actorUuid: tactor.uuid, updates: {"data.attributes.hp.value" : tactor.data.data.attributes.hp.value + workflow.damageList[d].oldHP - workflow.damageList[d].appliedDamage} });
				        console.warn("Wild Shape used");
                    } catch(err) {
                        console.error("Wild Shape error", err);
                    }
                }

                // burst
                if (tactor.data.flags["midi-qol"].burst && tactor.data.data.attributes.hp.value === 0 && workflow.damageList[d].oldHP !== 0 && workflow.damageList[d].newHP === 0) {
                    try {
                        console.warn("Burst activated");
				        const burst = actor.data.flags["midi-qol"].burst.split(",");
                		await applyDamage(tactor, token, burst[0], burst[1], burst[2], burst[3], burst[4], burst[5], burst[6]);
				        console.warn("Burst used");
                    } catch(err) {
                        console.error("Burst error", err);
                    }
                }
		    }

            const targets = Array.from(workflow.targets);
            for (let t = 0; t < targets.length; t++) {
                let token = targets[t];
                let tactor = token.actor;
                if (!tactor) continue;
            
                // unconscious cleanup
                if (tactor.data.data.attributes.hp.value === 0 || tactor.effects.find(e => e.data.label === "Unconscious")) {
                    try {
                        console.warn("Unconscious Cleanup activated");
                        if (!tactor.effects.find(e => e.data.label === "Prone")) {
                            const effectData = {
                                changes: [{ key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Prone", priority: 20, },],
                                disabled: false,
                                label: "Prone",
                            }
                            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        }
                        if (tactor.data.flags["midi-qol"]?.rage) {
                            let rage = tactor.effects.find(e => e.data.label === "Rage");
                            if (rage) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [rage.id] });
                        }
                        console.warn("Unconscious Cleanup used");
                    } catch(err) {
                        console.error("Unconscious Cleanup error", err);
                    }
                }
            }
        }
    } catch(err) {
        console.error("RollComplete Error", err);
    }
});