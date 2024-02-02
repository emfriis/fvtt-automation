try {
    if (args[0].macroPass == "postActiveEffects" && args[0].item.type == "spell" && args[0].item.name == "Thunderous Smite") {
        const effectData = { 
            changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: `${args[0].spellLevel}d6[${args[0].workflow.defaultDamageType}]`, priority: 20 }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.Nby4HdjIDxy90noL, postActiveEffects", priority: 20 }], 
            disabled: false, 
            icon: "icons/magic/fire/dagger-rune-enchant-flame-purple.webp", 
            name: "Thunderous Smite Damage Bonus", 
            duration: { seconds: 60 }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        const effect = args[0].actor.effects.find(e => e.name == "Thunderous Smite Damage Bonus");
        if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
    } else if (args[0].macroPass == "postActiveEffects" && args[0].item.system.actionType == "mwak" && (args[0].hitTargets.length || MidiQOL.configSettings().autoRollDamage != "always") && args[0].damageRoll) {
        const itemData = {
            name: "Thunderous Smite",
            img: "icons/magic/fire/dagger-rune-enchant-flame-purple.webp",
            type: "feat",
            system: {
                activation: { type: "special" },
                target: { value: 1, type: "creature" },
                actionType: "save",
                save: { ability: "str", dc: `${args[0].actor.system.attributes.spelldc}`, scaling: "flat" },
            }
        }
        const item = new CONFIG.Item.documentClass(itemData, { parent: args[0].actor });
        await MidiQOL.completeItemRoll(item, {}, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [args[0].targetUuids[0]] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        if (conc) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [conc.id] });
        const sourceEffect = args[0].actor.effects.find(e => e.name == "Thunderous Smite Damage Bonus");
        if (sourceEffect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [sourceEffect.id] });
    }
} catch (err) {console.error("Thunderous Smite Macro - ", err)}