try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postActiveEffects") return;
    const effectData = { 
        changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: `${args[0].spellLevel}d6[radiant]`, priority: 20 }], 
        disabled: false, 
        icon: "icons/magic/fire/dagger-rune-enchant-flame-orange.webp", 
        name: "Branding Smite Damage Bonus", 
        duration: { seconds: 60 }, 
        flags: { dae: { specialDuration: ["1Hit:mwak"] }, effectmacro: { dnd5e: { rollDamage: { script: 'try {\nworkflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);\nif (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;\nconst target = workflow.hitTargets.values().next().value?.actor;\nconst effectData = {\nchanges: [{ key: "system.traits.ci.value", mode: 0, value: "invisible", priority: 20 }, { key: "ATL.light.dim", mode: 4, value: "5", priority: 20 }, { key: "ATL.light.color", mode: 5, value: "#F28C28", priority: 20 }, { key: "ATL.light.alpha", mode: 5, value: "0.1", priority: 20 }, { key: "ATL.light.animation", mode: 5, value: `{"type": "pulse", "speed": 3,"intensity": 1}`, priority: 20 }],\ndisabled: false,\nicon: "icons/magic/fire/dagger-rune-enchant-flame-orange.webp",\nname: "Branding Smite",\nduration: { seconds: 60 }\n};\nif (target) await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.uuid, effects: [effectData] });\nconst conc = actor.effects.find(e => e.label === "Concentrating");\nconst effect = target.effects.find(e => e.label === "Branding Smite");\nif (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: effect.uuid, priority: 20 }]) }] });\n} catch (err) {console.error("Branding Smite Macro - ", err)}' } } } }
    };
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    const conc = args[0].actor.effects.find(e => e.label === "Concentrating");
    const effect = args[0].actor.effects.find(e => e.label === "Branding Smite Damage Bonus");
    if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
} catch (err) {console.error("Branding Smite Macro - ", err)}

try {
    workflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);
    if (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;
    const target = workflow.hitTargets.values().next().value?.actor;
    const effectData = { 
        changes: [{ key: "system.traits.ci.value", mode: 0, value: "invisible", priority: 20 }, { key: "ATL.light.dim", mode: 4, value: "5", priority: 20 }, { key: "ATL.light.color", mode: 5, value: "#F28C28", priority: 20 }, { key: "ATL.light.alpha", mode: 5, value: "0.1", priority: 20 }, { key: "ATL.light.animation", mode: 5, value: `{"type": "pulse", "speed": 3,"intensity": 1}`, priority: 20 }], 
        disabled: false, 
        icon: "icons/magic/fire/dagger-rune-enchant-flame-orange.webp", 
        name: "Branding Smite", 
        duration: { seconds: 60 } 
    };
    if (target) await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.uuid, effects: [effectData] });
    const conc = actor.effects.find(e => e.label === "Concentrating");
    const effect = target.effects.find(e => e.label === "Branding Smite");
    if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
} catch (err) {console.error("Branding Smite Macro - ", err)}

'try {\nworkflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);\nif (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;\nconst target = workflow.hitTargets.values().next().value?.actor;\nconst effectData = {\nchanges: [{ key: "system.traits.ci.value", mode: 0, value: "invisible", priority: 20 }, { key: "ATL.light.dim", mode: 4, value: "5", priority: 20 }, { key: "ATL.light.color", mode: 5, value: "#F28C28", priority: 20 }, { key: "ATL.light.alpha", mode: 5, value: "0.1", priority: 20 }, { key: "ATL.light.animation", mode: 5, value: `{"type": "pulse", "speed": 3,"intensity": 1}`, priority: 20 }],\ndisabled: false,\nicon: "icons/magic/fire/dagger-rune-enchant-flame-orange.webp",\nname: "Branding Smite",\nduration: { seconds: 60 }\n};\nif (target) await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.uuid, effects: [effectData] });\nconst conc = actor.effects.find(e => e.label === "Concentrating");\nconst effect = target.effects.find(e => e.label === "Branding Smite");\nif (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: effect.uuid, priority: 20 }]) }] });\n} catch (err) {console.error("Branding Smite Macro - ", err)}'

try {
    if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects" && args[0].item.type === "spell" && args[0].item.name === "Branding Smite") {
        const effectData = { 
            changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: `2d6[${args[0].workflow.defaultDamageType}]`, priority: 20 }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "BrandingSmite, postActiveEffects", priority: 20 }], 
            disabled: false, 
            icon: "icons/magic/fire/dagger-rune-enchant-flame-orange.webp", 
            name: "Branding Smite Damage Bonus", 
            duration: { seconds: 60 }, 
            flags: { dae: { specialDuration: ["1Attack:mwak"] } }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.label === "Concentrating");
        const effect = args[0].actor.effects.find(e => e.label === "Branding Smite Damage Bonus");
        if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
    } else if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects" && args[0].item.system.actionType === "mwak" && args[0].targets.length && args[0].damageRoll) {
        const effectData = { 
            changes: [{ key: "system.traits.ci.value", mode: 0, value: "invisible", priority: 20 }, { key: "ATL.light.dim", mode: 4, value: "5", priority: 20 }, { key: "ATL.light.color", mode: 5, value: "#F28C28", priority: 20 }, { key: "ATL.light.alpha", mode: 5, value: "0.1", priority: 20 }, { key: "ATL.light.animation", mode: 5, value: `{"type": "pulse", "speed": 3,"intensity": 1}`, priority: 20 }], 
            disabled: false, 
            icon: "icons/magic/fire/dagger-rune-enchant-flame-orange.webp", 
            name: "Branding Smite", 
            duration: { seconds: 60 } 
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.label === "Concentrating");
        const effect = args[0].targets[0].actor.effects.find(e => e.label === "Branding Smite");
        if (conc && effect) {
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
        } else if (conc) {
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [conc.id] });
        }
    }
} catch (err) {console.error("Branding Smite Macro - ", err)}