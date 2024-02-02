try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "preActiveEffects" && args[0].item.effects.find(e => e.name == "Bardic Inspiration")) {
        const faces = args[0].actor.system.scale.bard.inspiration.faces;
        let hook1 = Hooks.on("createActiveEffect", async (effect) => {
            if (effect.name == "Bardic Inspiration" && effect.parent.uuid == args[0].targets[0].actor.uuid && effect.parent != args[0].actor.uuid) {
                let hook2 = Hooks.on("midi-qol.RollComplete", async (workflowNext) => {
                    if (args[0].uuid == workflowNext.uuid) {
                        const changes = args[0].targets[0].actor.effects.find(e => e.id == effect.id).changes;
                        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].targets[0].actor.uuid, updates: [{ _id: effect.id, changes: changes.concat([{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "CombatInspiration, postDamageRoll", priority: 20 }, { key: "flags.midi-qol.combatInspiration", mode: 5, value: `d${faces}`, priority: 20 }, { key: "flags.midi-qol.optional.bi.ac", mode: 5, value: `+1d${faces}`, priority: 20 }]) }] });
                        Hooks.off("midi-qol.RollComplete", hook2);
                    }
                });
                Hooks.off("createActiveEffect", hook1);
            }
        });
    } else if (args[0].tag == "OnUse" && args[0].macroPass == "postDamageRoll" && ["mwak", "rwak"].includes(args[0].item.system.actionType) && args[0].actor.flags["midi-qol"]?.combatInspiration) {
        const die = args[0].actor.flags["midi-qol"].combatInspiration;
        let dialog = new Promise((resolve) => {
            new Dialog({
            title: "Bardic Inspiration",
            content: `<p>Use Bardic Inspiration to deal 1${die} additional damage?</p>`,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: () => resolve(true)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => {resolve(false)}
                }
            },
            default: "cancel",
            close: () => {resolve(false)}
            }).render(true);
        });
        let useFeat = await dialog;
        if (!useFeat) return;
        let diceMult = args[0].isCritical ? 2 : 1;
        let bonusRoll = await new Roll('0 + ' + `${diceMult}${die}`).evaluate({async: true});
        if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
        for (let i = 1; i < bonusRoll.terms.length; i++) {
            args[0].damageRoll.terms.push(bonusRoll.terms[i]);
        }
        args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${diceMult}${die}`;
        args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
        await args[0].workflow.setDamageRoll(args[0].damageRoll);
        const effects = args[0].actor.effects.filter(e => e.name == "Bardic Inspiration").map(e => e.id);
        console.error(effects)
        if (effects) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: effects });
    }
} catch (err) {console.error("Combat Inspiration Macro - ", err)}