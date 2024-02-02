try {
    if (args[0].macroPass == "postActiveEffects" && args[0].item.type == "spell" && args[0].item.name == "Banishing Smite") {
        const effectData = { 
            changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: `5d10[${args[0].workflow.defaultDamageType}]`, priority: 20 }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.Vb7Yt4am1VhJ8WAj, postActiveEffects", priority: 20 }], 
            disabled: false, 
            icon: "icons/magic/fire/dagger-rune-enchant-flame-strong-teal-purple.webp", 
            name: "Banishing Smite Damage Bonus", 
            duration: { seconds: 60 }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        const effect = args[0].actor.effects.find(e => e.name == "Banishing Smite Damage Bonus");
        if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
    } else if (args[0].macroPass == "postActiveEffects" && args[0].item.system.actionType == "mwak" && (args[0].hitTargets.length || MidiQOL.configSettings().autoRollDamage != "always") && args[0].damageRoll) {
        const effectData = { 
            changes: [{ key: "ATL.elevation", mode: 5, value: -9999, priority: 99 }, { key: "ATL.hidden", mode: 5, value: true, priority: 99 }], 
            disabled: args[0].targets[0].actor.system.attributes.hp.value > 50 ? true : false, 
            icon: "icons/magic/fire/dagger-rune-enchant-flame-strong-teal-purple.webp", 
            name: "Banishing Smite", 
            duration: { seconds: 60 } 
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        const effect = args[0].targets[0].actor.effects.find(e => e.name == "Banishing Smite");
        if (conc && effect) {
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
        } else if (conc) {
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [conc.id] });
        }
        const sourceEffect = args[0].actor.effects.find(e => e.name == "Banishing Smite Damage Bonus");
        if (sourceEffect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [sourceEffect.id] });
    }
} catch (err) {console.error("Banishing Smite Macro - ", err)}