try {
    if (args[0].macroPass == "postActiveEffects" && args[0].item.type == "spell" && args[0].item.name == "Staggering Smite") {
        const effectData = { 
            changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: `4d6[${args[0].workflow.defaultDamageType}]`, priority: 20 }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.UYsniCXuCqwVSOmK, postActiveEffects", priority: 20 }], 
            disabled: false, 
            icon: "icons/magic/fire/dagger-rune-enchant-flame-strong-purple-pink.webp", 
            name: "Staggering Smite Damage Bonus", 
            duration: { seconds: 60 }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        const effect = args[0].actor.effects.find(e => e.name == "Staggering Smite Damage Bonus");
        if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
    } else if (args[0].macroPass == "postActiveEffects" && args[0].item.system.actionType == "mwak" && (args[0].hitTargets.length || MidiQOL.configSettings().autoRollDamage != "always") && args[0].damageRoll) {
        const itemData = {
            name: "Staggering Smite",
            img: "icons/magic/fire/dagger-rune-enchant-flame-strong-purple-pink.webp",
            type: "feat",
            flags: { midiProperties: { magiceffect: true } },
            system: {
                activation: { type: "special" },
                target: { value: 1, type: "creature" },
                actionType: "save",
                save: { ability: "wis", dc: `${args[0].actor.system.attributes.spelldc}`, scaling: "flat" },
            },
            effects: [{ 
                changes: [{ key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: 1, priority: 20 }, { key: "flags.midi-qol.disadvantage.ability.all", mode: 0, value: 1, priority: 20 }, { key: "flags.midi-qol.disadvantage.skill.all", mode: 0, value: 1, priority: 20 }], 
                disabled: false, 
                transfer: false,
                isSuppressed: false,
                icon: "icons/magic/fire/dagger-rune-enchant-flame-strong-purple-pink.webp", 
                name: "Staggering Smite", 
                duration: { rounds: 1 },
                flags: { dae: { specialDuration: ["turnEnd", "combatEnd"] } }
            }]
        }
        const item = new CONFIG.Item.documentClass(itemData, { parent: args[0].actor });
        await MidiQOL.completeItemRoll(item, {}, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [args[0].targetUuids[0]] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        const effect = args[0].targets[0].actor.effects.find(e => e.name == "Staggering Smite");
        if (conc && effect) {
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
        } else if (conc) {
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [conc.id] });
        }
        const sourceEffect = args[0].actor.effects.find(e => e.name == "Staggering Smite Damage Bonus");
        if (sourceEffect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [sourceEffect.id] });
    }
} catch (err) {console.error("Staggering Smite Macro - ", err)}