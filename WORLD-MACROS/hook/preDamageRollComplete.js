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
                    let hook = Hooks.on("midi-qol.damageRollComplete", async (workflowNext) => {
                        const effect = tactor.effects.find(e => e.data.label === "Magic Missile Negation");
                        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                        Hooks.off("midi-qol.damageRollComplete", hook);
                    });
                    console.warn("Shield used");
                } catch (err) {
                    console.error("Shield error", err);
                }
	  	    }
	    }
    } catch(err) {
        console.error("preDamageRollComplete error", err);
    }
});