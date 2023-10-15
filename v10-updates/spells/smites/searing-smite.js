try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postActiveEffects") return;
    const effectData = { 
        changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: `${args[0].spellLevel}d6[fire]`, priority: 20 }], 
        disabled: false, 
        icon: "icons/magic/fire/dagger-rune-enchant-flame-orange.webp", 
        name: "Searing Smite Damage Bonus", 
        duration: { seconds: 60 }, 
        flags: { dae: { specialDuration: ["1Hit:mwak"] }, effectmacro: { dnd5e: { rollDamage: { script: 'try {\nworkflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);\nif (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;\nconst target = workflow.hitTargets.values().next().value?.actor;\nconst effectData = {\nchanges: [{ key: "flags.midi-qol.OverTime", mode: 0, value: `turn=end,label=Searing Smite,saveAbility=con,saveDC=${actor.system.attributes.spelldc},damageRoll=1d6,damageType=fire,saveMagic=true,killAnim=true`, priority: 20 }],\ndisabled: false,\nicon: "icons/magic/fire/dagger-rune-enchant-flame-orange.webp",\nname: "Searing Smite",\nduration: { seconds: 60 }\n};\nif (target) await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.uuid, effects: [effectData] });\nconst conc = actor.effects.find(e => e.label === "Concentrating");\nconst effect = target.effects.find(e => e.label === "Searing Smite");\nif (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: effect.uuid, priority: 20 }]) }] });\n} catch (err) {console.error("Searing Smite Macro - ", err)}' } } } }
    };
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    const conc = args[0].actor.effects.find(e => e.label === "Concentrating");
    const effect = args[0].actor.effects.find(e => e.label === "Searing Smite Damage Bonus");
    if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
} catch (err) {console.error("Searing Smite Macro - ", err)}

try {
    workflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);
    if (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;
    const target = workflow.hitTargets.values().next().value?.actor;
    const effectData = { 
        changes: [{ key: "flags.midi-qol.OverTime", mode: 0, value: `turn=end,label=Searing Smite,saveAbility=con,saveDC=${actor.system.attributes.spelldc},damageRoll=1d6,damageType=fire,saveMagic=true,killAnim=true`, priority: 20 }], 
        disabled: false, 
        icon: "icons/magic/fire/dagger-rune-enchant-flame-orange.webp", 
        name: "Searing Smite", 
        duration: { seconds: 60 } 
    };
    if (target) await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.uuid, effects: [effectData] });
    const conc = actor.effects.find(e => e.label === "Concentrating");
    const effect = target.effects.find(e => e.label === "Searing Smite");
    if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
} catch (err) {console.error("Searing Smite Macro - ", err)}

'try {\nworkflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);\nif (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;\nconst target = workflow.hitTargets.values().next().value?.actor;\nconst effectData = {\nchanges: [{ key: "flags.midi-qol.OverTime", mode: 0, value: `turn=end,label=Searing Smite,saveAbility=con,saveDC=${actor.system.attributes.spelldc},damageRoll=1d6,damageType=fire,saveMagic=true,killAnim=true`, priority: 20 }],\ndisabled: false,\nicon: "icons/magic/fire/dagger-rune-enchant-flame-orange.webp",\nname: "Searing Smite",\nduration: { seconds: 60 }\n};\nif (target) await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.uuid, effects: [effectData] });\nconst conc = actor.effects.find(e => e.label === "Concentrating");\nconst effect = target.effects.find(e => e.label === "Searing Smite");\nif (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: effect.uuid, priority: 20 }]) }] });\n} catch (err) {console.error("Searing Smite Macro - ", err)}'

