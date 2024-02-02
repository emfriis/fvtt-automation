try {
    if (args[0].macroPass == "postActiveEffects" && args[0].item.type == "spell" && args[0].item.name == "Blinding Smite") {
        const effectData = { 
            changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: `3d8[${args[0].workflow.defaultDamageType}]`, priority: 20 }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.BIR1ZvzKXuoJ0Y3i, postActiveEffects", priority: 20 }], 
            disabled: false, 
            icon: "icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp", 
            name: "Blinding Smite Damage Bonus", 
            duration: { seconds: 60 }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        const effect = args[0].actor.effects.find(e => e.name == "Blinding Smite Damage Bonus");
        if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
    } else if (args[0].macroPass == "postActiveEffects" && args[0].item.system.actionType == "mwak" && (args[0].hitTargets.length || MidiQOL.configSettings().autoRollDamage != "always") && args[0].damageRoll) {
        const itemData = {
            name: "Blinding Smite",
            img: "icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp",
            type: "feat",
            flags: { midiProperties: { magiceffect: true }, "midi-qol": { effectCondition: "!target.traits.ci.value.has('blinded')" } },
            system: {
                activation: { type: "special" },
                target: { value: 1, type: "creature" },
                actionType: "save",
                save: { ability: "con", dc: `${args[0].actor.system.attributes.spelldc}`, scaling: "flat" },
            },
            effects: [{ 
                changes: [{ key: "macro.CE", mode: 0, value: "Blinded", priority: 20 }, { key: "flags.midi-qol.OverTime", mode: 0, value: `turn=end,label=Blinding Smite (Blinded),saveAbility=con,saveDC=${args[0].actor.system.attributes.spelldc},saveMagic=true,killAnim=true`, priority: 20 }], 
                disabled: false, 
                transfer: false,
                isSuppressed: false,
                icon: "icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp", 
                name: "Blinding Smite", 
                duration: { seconds: 60 } 
            }]
        }
        const item = new CONFIG.Item.documentClass(itemData, { parent: args[0].actor });
        await MidiQOL.completeItemRoll(item, {}, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [args[0].targetUuids[0]] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        const effect = args[0].targets[0].actor.effects.find(e => e.name == "Blinding Smite" && !e.disabled);
        if (conc && effect) {
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
        } else if (conc) {
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [conc.id] });
        }
        const sourceEffect = args[0].actor.effects.find(e => e.name == "Blinding Smite Damage Bonus");
        if (sourceEffect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [sourceEffect.id] });
    }
} catch (err) {console.error("Blinding Smite Macro - ", err)}