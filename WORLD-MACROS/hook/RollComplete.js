// RollComplete

function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

async function applyBurst(token, range, value, type, saveDC, saveType, saveDamage, magicEffect, duration) {
    const itemData = {
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} Burst`,
        img: "systems/dnd5e/icons/skills/yellow_15.jpg",
        type: "feat",
        flags: {
            midiProperties: {
                magiceffect: (magicEffect === "magiceffect" ? true : false),
                nodam: (saveDamage === "nodam" ? true : false),
                halfdam: (saveDamage === "halfdam" ? true : false),
            }
        },
        effects: value === "condition" ? [
            {
                _id: null,
                changes: type === "blinded" ? parseInt(duration) ? [
                    { key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `Convenient Effect: Blinded`, priority: 20, },
                    { key: "macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `AttemptRemoval ${saveDC} ${saveType} save auto`, priority: 20, },
                    { key: "ATL.flags.perfect-vision.sightLimit", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 20, value: `[[max(0,@attributes.senses.blindsight,@attributes.senses.tremorsense)]]`, },
                    { key: "ATCV.blinded", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20, value: "1" },
                    { key: "ATCV.conditionBlinded", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20, value: "true" },
                    { key: "ATCV.conditionType", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20, value: "sense" },
                    { key: "ATCV.conditionTargets", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20, value: "" }, 
                    { key: "ATCV.conditionSources", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20, value: "" },
                ] : [
                    { key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `Convenient Effect: Blinded`, priority: 20, },
                    { key: "ATL.flags.perfect-vision.sightLimit", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 20, value: `[[max(0,@attributes.senses.blindsight,@attributes.senses.tremorsense)]]`, },
                    { key: "ATCV.blinded", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20, value: "1" },
                    { key: "ATCV.conditionBlinded", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20, value: "true" },
                    { key: "ATCV.conditionType", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20, value: "sense" },
                    { key: "ATCV.conditionTargets", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20, value: "" }, 
                    { key: "ATCV.conditionSources", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 20, value: "" },
                ] : parseInt(duration) ? [
                    { key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `Convenient Effect: ${type.charAt(0).toUpperCase() + type.slice(1)}`, priority: 20, },
                    { key: "macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `AttemptRemoval ${saveDC} ${saveType} save auto`, priority: 20, },
                ] : [{ key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `Convenient Effect: ${type.charAt(0).toUpperCase() + type.slice(1)}`, priority: 20, }],
                duration: parseInt(duration) ? { seconds: parseInt(duration), startTime: game.time.worldTime } : null,
                flags: parseInt(duration) ? { dae: { macroRepeat: "endEveryTurn" }, magiceffect: magicEffect === "magiceffect" } : { dae: { specialDuration: [duration] }, magiceffect: magicEffect === "magiceffect" },
                transfer: false,
            }
        ] : [],
        data: {
            "activation.type": "none",
            actionType: (parseInt(saveDC) ? "save" : "other"),
            "damage.parts": value !== "condition" ? [[`${value}[${type}]`, type]] : [],
            save: { dc: (parseInt(saveDC) ? parseInt(saveDC) : null), ability: (parseInt(saveDC) ? saveType : null), scaling: "flat" },
            target: { value: null, width: null, units: null, type: "creature" },
        }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: token.actor });
    const targets = canvas.tokens.placeables.filter(t => (MidiQOL.getDistance(token, t, false) <= parseInt(range) && t.document.uuid !== token.document.uuid)).map(t => t.document.uuid);
    const options = { showFullCard: false, createWorkflow: true, configureDialog: false, targetUuids: targets };
    await MidiQOL.completeItemRoll(item, options);
};

Hooks.on("midi-qol.RollComplete", async (workflow) => {
    try {

        // template removal
        if (workflow.templateId && !workflow.item.data.data.duration.value && canvas.scene.templates.find(t => t.id === workflow.templateId)) {
            try {
                console.warn("Template Removal activated");
                await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [workflow.templateId]);
                console.warn("Template Removal used");
            } catch(err) {
                console.error("Template Removal error", err);
            }
        }

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
                // range,value,type,saveDC,saveType,saveDamage,magic,duration
                if (tactor.data.flags["midi-qol"].burst && tactor.data.data.attributes.hp.value === 0 && workflow.damageList[d].oldHP !== 0 && workflow.damageList[d].newHP === 0) {
                    try {
                        console.warn("Burst activated");
				        const burst = tactor.data.flags["midi-qol"].burst.split(",");
                		await applyBurst(token, burst[0], burst[1], burst[2], burst[3], burst[4], burst[5], burst[6], burst[7]);
				        console.warn("Burst used");
                    } catch(err) {
                        console.error("Burst error", err);
                    }
                }

                // hexblades curse
                if (tactor.data.flags["midi-qol"].hexbladesCurse && tactor.data.data.attributes.hp.value === 0 && workflow.damageList[d].oldHP !== 0 && workflow.damageList[d].newHP === 0) {
                    try {
                        console.warn("Hexblade's Curse activated");
				        let hexIds = tactor.data.flags["midi-qol"].hexbladesCurse.split("+");
                        for (let h = 0; h < hexIds.length; h++) {
                            let hexToken = canvas.tokens.get(hexIds[h]);
                            if (hexToken?.actor) {
                                let actorData = hexToken.actor.getRollData();
                                let level = actorData.details?.cr ?? actorData.classes?.warlock?.levels;
                                let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
                                if (applyDamage) await applyDamage.execute("ApplyDamage", hexToken.id, hexToken.id, `${Math.max(1, level + actorData.abilities.cha.mod)}`, "healing", "magiceffect");
                                console.warn("Hexblade's Curse used");
                            }
                        }
                    } catch(err) {
                        console.error("Hexblade's Curse error", err);
                    }
                }
		    }
        }

        if (workflow.targets) {
            const targets = Array.from(workflow.targets);
            for (let t = 0; t < targets.length; t++) {
                let token = targets[t];
                let tactor = token.actor;
                if (!tactor) continue;

                // downed
                if (tactor.effects.find(e => ["Dead", "Defeated", "Unconscious"].includes(e.data.label) && !e.data.disabled)) {
                    try {
                        console.warn("Downed activated");
                        if (!tactor.effects.find(e => e.data.label === "Prone")) await game.dfreds.effectInterface.addEffect({ effectName: "Prone", uuid: tactor.uuid });
                        if (tactor.data.flags["midi-qol"]?.rage && tactor.effects.find(e => e.data.label === "Rage")) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [tactor.effects.find(e => e.data.label === "Rage").id] });
                        console.warn("Downed used");
                    } catch (err) {
                        console.error("Downed error", err);
                    }
                }
            }
        }
    } catch(err) {
        console.error("RollComplete Error", err);
    }
});