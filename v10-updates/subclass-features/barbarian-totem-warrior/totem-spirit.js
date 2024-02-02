try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "preActiveEffects" || !args[0].item.effects.find(e => e.name == "Rage")) return;
    if (args[0].actor.items.find(i => i.name == "Totem Spirit: Wolf")) {
        let hook1 = Hooks.on("createActiveEffect", async (effect) => {
            if (effect.name == "Rage" && effect.parent.uuid == args[0].actor.uuid) {
                let hook2 = Hooks.on("midi-qol.RollComplete", async (workflowNext) => {
                    if (args[0].uuid == workflowNext.uuid) {
                        const changes = args[0].actor.effects.find(e => e.id == effect.id).changes;
                        const effectData = {
                            changes: [{ key: "flags.midi-qol.grants.advantage.attack.mwak", mode: 0, value: `actorUuid!="${args[0].actorUuid}"&&targetActorUuid!="${args[0].actorUuid}"`, priority: 20 }],
                            disabled: false,
                            name: "Totem Spirit: Wolf",
                            icon: "icons/commodities/claws/claw-canine-brown-grey.webp",
                            duration: { seconds: 60 },
                            flags: { ActiveAuras: { aura: "Enemy", displayTemp: true, height: true, hidden: true, hostile: false, ignoreSelf: true, isAura: true, onlyOnce: false, radius: 5, wallsBlock: "true", customCheck: "MidiQOL.typeOrRace(actor.uuid)" } }
                        }
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
                        const auraEffect = args[0].actor.effects.find(e => e.name == "Totem Spirit: Wolf");
                        if (auraEffect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, changes: changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: auraEffect.uuid, priority: 20 }]) }] });
                        Hooks.off("midi-qol.RollComplete", hook2);
                    }
                });
                Hooks.off("createActiveEffect", hook1);
            }
        });
    }
    if (args[0].actor.items.find(i => i.name == "Totem Spirit: Bear")) {
        let hook1 = Hooks.on("createActiveEffect", async (effect) => {
            if (effect.name == "Rage" && effect.parent.uuid == args[0].actor.uuid) {
                let hook2 = Hooks.on("midi-qol.RollComplete", async (workflowNext) => {
                    if (args[0].uuid == workflowNext.uuid) {
                        const changes = args[0].actor.effects.find(e => e.id == effect.id).changes;
                        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, changes: changes.concat([
                            { key: "system.traits.dr.value", mode: 0, value: "acid", priority: 20 },
                            { key: "system.traits.dr.value", mode: 0, value: "cold", priority: 20 },
                            { key: "system.traits.dr.value", mode: 0, value: "fire", priority: 20 },
                            { key: "system.traits.dr.value", mode: 0, value: "force", priority: 20 },
                            { key: "system.traits.dr.value", mode: 0, value: "lightning", priority: 20 },
                            { key: "system.traits.dr.value", mode: 0, value: "necrotic", priority: 20 },
                            { key: "system.traits.dr.value", mode: 0, value: "poison", priority: 20 },
                            { key: "system.traits.dr.value", mode: 0, value: "radiant", priority: 20 },
                            { key: "system.traits.dr.value", mode: 0, value: "thunder", priority: 20 }
                        ]) }] });
                        Hooks.off("midi-qol.RollComplete", hook2);
                    }
                });
                Hooks.off("createActiveEffect", hook1);
            }
        });
    }
} catch (err) {console.error("Totem Spirit Macro - ", err)}