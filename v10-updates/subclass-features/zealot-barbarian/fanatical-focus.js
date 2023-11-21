try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "preActiveEffects" || !args[0].item.effects.find(e => e.name == "Rage")) return;
    let hook1 = Hooks.on("createActiveEffect", async (effect) => {
        if (effect.name == "Rage" && effect.parent.uuid == args[0].actor.uuid) {
            let hook2 = Hooks.on("midi-qol.RollComplete", async (workflowNext) => {
                if (args[0].uuid == workflowNext.uuid) {
                    const changes = args[0].actor.effects.find(e => e.id == effect.id).changes;
                    const effectData = {
                        changes: [{ key: "flags.midi-qol.optional.fafo.label", mode: 5, value: "Fanatical Focus", priority: 20 }, { key: "flags.midi-qol.optional.fafo.save.all", mode: 5, value: "reroll", priority: 20 }],
                        disabled: false,
                        name: "Fanatical Focus Save Reroll",
                        icon: "icons/equipment/head/hood-cloth-teal-gold.webp",
                        duration: { seconds: 60 }
                    }
                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
                    const saveEffect = args[0].actor.effects.find(e => e.name == "Fanatical Focus Save Reroll");
                    if (saveEffect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, changes: changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: saveEffect.uuid, priority: 20 }]) }] });
                    Hooks.off("midi-qol.RollComplete", hook2);
                }
            });
            Hooks.off("createActiveEffect", hook1);
        }
    });
} catch (err) {console.error("Fanatical Focus Macro - ", err)}