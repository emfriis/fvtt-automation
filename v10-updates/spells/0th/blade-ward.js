try {
    if (args[0].tag != "TargetOnUse" || args[0].macroPass != "isAttacked" || !["mwak", "rwak"].includes(args[0].item.system.actionType)) return;
    let hook1 = Hooks.on("midi-qol.preDamageRollComplete", async workflowNext => {
        if (workflowNext.uuid == args[0].uuid) {
            const effectData = {
                disabled: false,
                changes: [{ key: "system.traits.dr.value", mode: 0, value: "bludgeoning", priority: 20 }, { key: "system.traits.dr.value", mode: 0, value: "piercing", priority: 20 }, { key: "system.traits.dr.value", mode: 0, value: "slashing", priority: 20 }],
                icon: "icons/magic/defensive/shield-barrier-glowing-triangle-orange.webp",
                name: "Blade Ward Damage Resistance"
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].options.actor.uuid, effects: [effectData] });
            Hooks.once("midi-qol.damageApplied", async () => {
                const effects = args[0].targets[0].actor.effects.filter(e => e.name == "Blade Ward Damage Resistance").map(e => e.id);
                if (effects) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].options.actor.uuid, effects: effects });
            });
        }
    });
    let hook2 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
        if (workflowNext.uuid == args[0].uuid) {
            Hooks.off("midi-qol.preDamageRollComplete", hook1);
            Hooks.off("midi-qol.preItemRoll", hook2);
        }
    });
} catch (err) {console.error("Blade Ward Macro - ", err)}