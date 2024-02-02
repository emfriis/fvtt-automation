try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "preActiveEffects" || !args[0].item.effects.find(e => e.name == "Rage")) return;
    if (args[0].actor.items.find(i => i.name == "Totemic Attunement: Bear")) {
        let hook1 = Hooks.on("createActiveEffect", async (effect) => {
            if (effect.name == "Rage" && effect.parent.uuid == args[0].actor.uuid) {
                let hook2 = Hooks.on("midi-qol.RollComplete", async (workflowNext) => {
                    if (args[0].uuid == workflowNext.uuid) {
                        const changes = args[0].actor.effects.find(e => e.id == effect.id).changes;
                        const effectData = {
                            changes: [{ key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: `actorUuid!="${args[0].actor.uuid}"&&!canvas.tokens.get(targetId).actor.effects.find(e=>e.name=="Totemic Attunement: Bear")&&!traits.ci.value.has("frightened")&&MidiQOL.canSense(canvas.tokens.get(tokenId), canvas.tokens.get("${args[0].tokenId}"))`, priority: 20 }],
                            disabled: false,
                            name: "Totemic Attunement: Bear",
                            icon: "icons/commodities/claws/claws-bear-brown-white.webp",
                            duration: { seconds: 60 },
                            flags: { ActiveAuras: { aura: "Enemy", displayTemp: true, height: true, hidden: true, hostile: false, ignoreSelf: true, isAura: true, nameOverride: "Totemic Attunement: Bear Disadvantage", onlyOnce: false, radius: 5, wallsBlock: "true", customCheck: "MidiQOL.typeOrRace(actor.uuid)" } }
                        }
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
                        const auraEffect = args[0].actor.effects.find(e => e.name == "Totemic Attunement: Bear");
                        if (auraEffect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, changes: changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: auraEffect.uuid, priority: 20 }]) }] });
                        Hooks.off("midi-qol.RollComplete", hook2);
                    }
                });
                Hooks.off("createActiveEffect", hook1);
            }
        });
    }
    if (args[0].actor.items.find(i => i.name == "Totemic Attunement: Eagle")) {
        let hook1 = Hooks.on("createActiveEffect", async (effect) => {
            if (effect.name == "Rage" && effect.parent.uuid == args[0].actor.uuid) {
                let hook2 = Hooks.on("midi-qol.RollComplete", async (workflowNext) => {
                    if (args[0].uuid == workflowNext.uuid) {
                        const changes = args[0].actor.effects.find(e => e.id == effect.id).changes;
                        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, changes: changes.concat([{ key: "system.attributes.movement.fly", mode: 4, value: `${args[0].actor.system.attributes.movement.walk}`, priority: 20 }]) }] });
                        Hooks.off("midi-qol.RollComplete", hook2);
                    }
                });
                Hooks.off("createActiveEffect", hook1);
            }
        });
    }
} catch (err) {console.error("Totemic Attunement Macro - ", err)}