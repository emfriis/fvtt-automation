try {
    workflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);
    if (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;
    const effectTarget = workflow.hitTargets[0]?.actor;
    const effectData = { 
        changes: [
            { key: "macro.CE", mode: 0, value: "", priority: 20 },
            { key: "", mode: 0, value: `turn=end,label= Smite,saveAbility=,saveDC=${actor.system.attributes.spelldc}`, priority: 20 }
        ], 
        disabled: false, 
        icon: "", 
        name: " Smite", 
        duration: { seconds: 60 } 
    };
    if (effectTarget) await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: effectTarget.uuid, effects: [effectData] });
    const conc = actor.effects.find(e => e.label === "Concentrating");
    const effect = effectTarget.effects.find(e => e.label === " Smite");
    if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
} catch (err) {console.error(" Smite Macro - ", err)}