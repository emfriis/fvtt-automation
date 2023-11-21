try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "preActiveEffects" || !args[0].item.effects.find(e => e.name == "Rage")) return
    let hook1 = Hooks.on("createActiveEffect", async (effect) => {
        if (effect.name == "Rage" && effect.parent.uuid == args[0].actor.uuid) {
            let hook2 = Hooks.on("midi-qol.RollComplete", async (workflowNext) => {
                if (args[0].uuid == workflowNext.uuid) {
                    const changes = args[0].actor.effects.find(e => e.id == effect.id).changes;
                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, changes: changes.concat([{ key: "system.traits.ci.value", mode: 0, value: "unconscious", priority: 20 }, { key: "system.traits.ci.custom", mode: 0, value: "Dead", priority: 20 }]) }] });
                    Hooks.off("midi-qol.RollComplete", hook2);
                }
            });
            Hooks.off("createActiveEffect", hook1);
        }
    });
} catch (err) {console.error("Rage Beyond Death Macro - ", err)}