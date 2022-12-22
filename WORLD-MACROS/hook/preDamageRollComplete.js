// preDamageRollComplete

Hooks.on("midi-qol.preDamageRollComplete", async (workflow) => {
    try {  
	    const targets = Array.from(workflow.targets);
        for (let t = 0; t < targets.length; t++) {
        	const token = targets[t];
	  	    let tactor = token?.actor;
        	if (!tactor) continue;

            // shield
            if (workflow.item.name === "Magic Missile" && workflow.item.data.data.activation.type !== "action" && tactor.effects.find(e => e.data.label === "Shield")) {
                try {
                    console.warn("Shield activated");
                    const effectData = {
                        changes: [{ key: "data.traits.di.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
                        disabled: false,
                        label: "Magic Missile Negation",
                    };
                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                    let hook = Hooks.on("midi-qol.preApplyDynamicEffects", async (workflowNext) => {
                        if (workflow.uuid === workflowNext.uuid) {
                            const effect = tactor.effects.find(e => e.data.label === "Magic Missile Negation");
                            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                            Hooks.off("midi-qol.preApplyDynamicEffects", hook);
                        }
                    });
                    console.warn("Shield used");
                } catch (err) {
                    console.error("Shield error", err);
                }
	  	    }

            // fighting style interception
            if (workflow.hitTargets.size && ["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) {
                try {
                    console.warn("Fighting Style Interception activated");
                    let protTokens = await canvas.tokens.placeables.filter(p => {
                        let protToken = (
                            p?.actor && // exists
                            p.actor.data.flags["midi-qol"].interception && // has feature
                            p.actor.uuid !== workflow.token.actor.uuid && // not attacker
                            p.actor.uuid !== token.actor.uuid && // not target
                            (p.actor.items.find(i => i.data.data?.armor?.type === "shield" && i.data.data.equipped) || p.actor.items.find(i => i.data.type === "weapon" && ["martialM","simpleM","martialR","simpleR"].includes(i.data.data.weaponType))) && // shield or weapon equipped
                            !p.actor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Reaction", "Stunned", "Unconscious"].includes(e.data.label)) && // can react
                            canSee(p, workflow.token) // can see attacker
                        );
                        return protToken;
                    });
                    for (let p = 0; p < intTokens.length; p++) {
                        let prot = protTokens[p];
                        if (MidiQOL.getDistance(prot, token, false) <= 5 && prot.data.disposition === token.data.disposition && prot.document.uuid !== token.document.uuid) {
                            let player = await playerForActor(prot.actor);
                            let useProtect = false;
                            if (socket) useProtect = await socket.executeAsUser("useDialog", player.id, { title: `Fighting Style: Interception`, content: `Use your reaction to reduce damage from attack against ${token.name}?` });
                            if (useProtect) {
                                
                                if (game.combat) game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: prot.actor.uuid });
                                console.warn("Fighting Style Interception used");
                            }
                        }
                    }
                } catch (err) {
                    console.error("Fighting Style Interception error", err);
                }
            }
	    }
    } catch(err) {
        console.error("preDamageRollComplete error", err);
    }
});