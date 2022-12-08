// postApplyDynamicEffects

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

Hooks.on("midi-qol.postApplyDynamicEffects", async (workflow) => {
    try {
        let attackWorkflow;
        if (workflow.damageList) attackWorkflow = workflow.damageList.map((d) => ({ tokenUuid: d.tokenUuid, appliedDamage: d.appliedDamage, newHP: d.newHP, oldHP: d.oldHP, damageDetail: d.damageDetail }));
        if (attackWorkflow) {
            for (let a = 0; a < attackWorkflow.length; a++) {
                let token = await fromUuid(attackWorkflow[a].tokenUuid);
                let tactor = token.actor ? token.actor : token;
		        if (!tactor) continue;

                // burst
                if (tactor.data.data.attributes.hp.value === 0 && attackWorkflow[a].oldHP !== 0 && attackWorkflow[a].newHP === 0 && tactor.data.flags["midi-qol"].burst) {
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
        }
    } catch(err) {
        console.error("postApplyDynamicEffects Error", err);
    }
});