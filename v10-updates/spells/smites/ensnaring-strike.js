try {
    if (args[0].macroPass == "postActiveEffects" && args[0].item.type == "spell" && args[0].item.name == "Ensnaring Strike") {
        const effectData = { 
            changes: [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.4nFVFXarSSlzYUs9, postActiveEffects", priority: 20 }, {key: "flags.midi-qol.ensnaringStrike", mode: 5, value: args[0].spellLevel, priority: 20}], 
            disabled: false, 
            icon: "icons/magic/nature/vines-thorned-curled-glow-teal.webp", 
            name: "Ensnaring Strike", 
            duration: { seconds: 60 }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        const effect = args[0].actor.effects.find(e => e.name == "Ensnaring Strike");
        if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
    } else if (args[0].macroPass == "postActiveEffects" && ["mwak", "rwak"].includes(args[0].item.system.actionType) && (args[0].hitTargets.length || MidiQOL.configSettings().autoRollDamage != "always") && args[0].damageRoll) {
        const itemData = {
            name: "Ensnaring Strike",
            img: "icons/magic/nature/vines-thorned-curled-glow-teal.webp",
            type: "feat",
            flags: { midiProperties: { magiceffect: true }, "midi-qol": { effectCondition: "!target.traits.ci.value.has('restrained')" } },
            system: {
                activation: { type: "special" },
                target: { value: 1, type: "creature" },
                actionType: "save",
                save: { ability: "str", dc: `${args[0].actor.system.attributes.spelldc}`, scaling: "flat" },
            },
            effects: [{ 
                disabled: false, 
                transfer: false,
                isSuppressed: false,
                changes: [{ key: "macro.CE", mode: 0, value: "Restrained", priority: 20 }, { key: "flags.midi-qol.OverTime", mode: 0, value: `turn=start,label=Ensnaring Strike,damageRoll=${args[0].actor.flags["midi-qol"].ensnaringStrike}d6,damageType=piercing,saveMagic=true,killAnim=true`, priority: 20 }], 
                icon: "icons/magic/nature/vines-thorned-curled-glow-teal.webp", 
                name: "Ensnaring Strike", 
                duration: { seconds: 60 } 
            }]
        }
        const item = new CONFIG.Item.documentClass(itemData, { parent: args[0].actor });
        await MidiQOL.completeItemRoll(item, {}, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [args[0].targetUuids[0]] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        const effect = args[0].targets[0].actor.effects.find(e => e.name == "Ensnaring Strike");
        if (conc && effect) {
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
        } else if (conc) {
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [conc.id] });
        }
        const sourceEffect = args[0].actor.effects.find(e => e.name == "Ensnaring Strike");
        if (sourceEffect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [sourceEffect.id] });
    }
} catch (err) {console.error("Ensnaring Strike Macro - ", err)}