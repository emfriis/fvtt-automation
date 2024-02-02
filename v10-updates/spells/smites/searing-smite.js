try {
    if (args[0].macroPass == "postActiveEffects" && args[0].item.type == "spell" && args[0].item.name == "Searing Smite") {
        const effectData = { 
            changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: `${args[0].spellLevel}d6[${args[0].workflow.defaultDamageType}]`, priority: 20 }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.O881prKRqQbOr0ih, postActiveEffects", priority: 20 }], 
            disabled: false, 
            icon: "icons/magic/fire/dagger-rune-enchant-flame-red.webp", 
            name: "Searing Smite Damage Bonus", 
            duration: { seconds: 60 }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        const effect = args[0].actor.effects.find(e => e.name == "Searing Smite Damage Bonus");
        if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
    } else if (args[0].macroPass == "postActiveEffects" && args[0].item.system.actionType == "mwak" && (args[0].hitTargets.length || MidiQOL.configSettings().autoRollDamage != "always") && args[0].damageRoll) {
        const effectData = { 
            changes: [{ key: "flags.midi-qol.OverTime", mode: 0, value: `turn=end,label=Searing Smite,saveAbility=con,saveDC=${actor.system.attributes.spelldc},damageRoll=1d6,damageType=fire,saveMagic=true,killAnim=true`, priority: 20 }], 
            disabled: false, 
            icon: "icons/magic/fire/dagger-rune-enchant-flame-red.webp", 
            name: "Searing Smite", 
            duration: { seconds: 60 } 
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        const effect = args[0].targets[0].actor.effects.find(e => e.name == "Searing Smite");
        if (conc && effect) {
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
        } else if (conc) {
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [conc.id] });
        }
        const sourceEffect = args[0].actor.effects.find(e => e.name == "Searing Smite Damage Bonus");
        if (sourceEffect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [sourceEffect.id] });
    }
} catch (err) {console.error("Searing Smite Macro - ", err)}