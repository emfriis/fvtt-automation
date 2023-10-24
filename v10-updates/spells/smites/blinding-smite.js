//----------------------------------------

try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postActiveEffects") return;
    const effectData = { 
        changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: "3d8[radiant]", priority: 20 }], 
        disabled: false, 
        icon: "icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp", 
        name: "Blinding Smite Damage Bonus", 
        duration: { seconds: 60 }, 
        flags: { dae: { specialDuration: ["1Hit:mwak"] }, effectmacro: { dnd5e: { rollDamage: { script: 'try {\nworkflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);\nif (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;\nconst target = workflow.hitTargets.values().next().value?.actor;\nconst itemData = {\nname: "Blinding Smite",\nimg: "icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp",\ntype: "feat",\nflags: { midiProperties: { magiceffect: true } },\nsystem: {\nactivation: { type: "special" },\ntarget: { type: "self" },\nrange: { units: "self" },\nactionType: "save",\nsave: { ability: "con", dc: `${actor.system.attributes.spelldc}`, scaling: "flat" },\n},\neffects: [{\nchanges: [{ key: "macro.CE", mode: 0, value: "Blinded", priority: 20 }, { key: "flags.midi-qol.OverTime", mode: 0, value: `turn=end,label=Blinding Smite,saveAbility=con,saveDC=${actor.system.attributes.spelldc},saveMagic=true,killAnim=true`, priority: 20 }],\ndisabled: false,\ntransfer: false,\nisSuppressed: false,\nicon: "icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp",\nname: "Blinding Smite",\nduration: { seconds: 60 }\n}]\n}\nconst item = new CONFIG.Item.documentClass(itemData, { parent: target });\nawait MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });\nconst conc = actor.effects.find(e => e.label === "Concentrating");\nconst effect = target.effects.find(e => e.label === "Blinding Smite");\nif (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });\n} catch (err) {console.error("Blinding Smite Macro - ", err)}' } } } }
    };
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    const conc = args[0].actor.effects.find(e => e.label === "Concentrating");
    const effect = args[0].actor.effects.find(e => e.label === "Blinding Smite Damage Bonus");
    if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
} catch (err) {console.error("Blinding Smite Macro - ", err)}

try {
    workflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);
    if (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;
    const target = workflow.hitTargets.values().next().value?.actor;
    const itemData = {
        name: "Blinding Smite",
        img: "icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp",
        type: "feat",
        flags: { midiProperties: { magiceffect: true } },
        system: {
            activation: { type: "special" },
            target: { type: "self" },
            range: { units: "self" },
            actionType: "save",
            save: { ability: "con", dc: `${actor.system.attributes.spelldc}`, scaling: "flat" },
        },
        effects: [{ 
            changes: [{ key: "macro.CE", mode: 0, value: "Blinded", priority: 20 }, { key: "flags.midi-qol.OverTime", mode: 0, value: `turn=end,label=Blinding Smite,saveAbility=con,saveDC=${actor.system.attributes.spelldc},saveMagic=true,killAnim=true`, priority: 20 }], 
            disabled: false, 
            transfer: false,
            isSuppressed: false,
            icon: "icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp", 
            name: "Blinding Smite", 
            duration: { seconds: 60 } 
        }]
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: target });
    await MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
    const conc = actor.effects.find(e => e.label === "Concentrating");
    const effect = target.effects.find(e => e.label === "Blinding Smite");
    if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
} catch (err) {console.error("Blinding Smite Macro - ", err)}

'try {\nworkflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);\nif (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;\nconst target = workflow.hitTargets.values().next().value?.actor;\nconst itemData = {\nname: "Blinding Smite",\nimg: "icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp",\ntype: "feat",\nflags: { midiProperties: { magiceffect: true } },\nsystem: {\nactivation: { type: "special" },\ntarget: { type: "self" },\nrange: { units: "self" },\nactionType: "save",\nsave: { ability: "con", dc: `${actor.system.attributes.spelldc}`, scaling: "flat" },\n},\neffects: [{\nchanges: [{ key: "macro.CE", mode: 0, value: "Blinded", priority: 20 }, { key: "flags.midi-qol.OverTime", mode: 0, value: `turn=end,label=Blinding Smite,saveAbility=con,saveDC=${actor.system.attributes.spelldc},saveMagic=true,killAnim=true`, priority: 20 }],\ndisabled: false,\ntransfer: false,\nisSuppressed: false,\nicon: "icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp",\nname: "Blinding Smite",\nduration: { seconds: 60 }\n}]\n}\nconst item = new CONFIG.Item.documentClass(itemData, { parent: target });\nawait MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });\nconst conc = actor.effects.find(e => e.label === "Concentrating");\nconst effect = target.effects.find(e => e.label === "Blinding Smite");\nif (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });\n} catch (err) {console.error("Blinding Smite Macro - ", err)}'

//----------------------------------------

try {
    if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects" && args[0].item.type === "spell" && args[0].item.name === "Blinding Smite") {
        const effectData = { 
            changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: `3d8[${args[0].workflow.defaultDamageType}]`, priority: 20 }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "BlindingSmite, postActiveEffects", priority: 20 }], 
            disabled: false, 
            icon: "icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp", 
            name: "Blinding Smite Damage Bonus", 
            duration: { seconds: 60 }, 
            flags: { dae: { specialDuration: ["1Attack:mwak"] } }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.label === "Concentrating");
        const effect = args[0].actor.effects.find(e => e.label === "Blinding Smite Damage Bonus");
        if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
    } else if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects" && args[0].item.system.actionType === "mwak" && args[0].targets.length && args[0].damageRoll) {
        const itemData = {
            name: "Blinding Smite",
            img: "icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp",
            type: "feat",
            flags: { midiProperties: { magiceffect: true }, "midi-qol": { effectActivation: true } },
            system: {
                activation: { type: "special", condition: "!target.traits.ci.value.has('blinded')" },
                target: { type: "self" },
                range: { units: "self" },
                actionType: "save",
                save: { ability: "con", dc: `${args[0].actor.system.attributes.spelldc}`, scaling: "flat" },
            },
            effects: [{ 
                changes: [{ key: "macro.CE", mode: 0, value: "Blinded", priority: 20 }, { key: "flags.midi-qol.OverTime", mode: 0, value: `turn=end,label=Blinding Smite,saveAbility=con,saveDC=${args[0].actor.system.attributes.spelldc},saveMagic=true,killAnim=true`, priority: 20 }], 
                disabled: false, 
                transfer: false,
                isSuppressed: false,
                icon: "icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp", 
                name: "Blinding Smite", 
                duration: { seconds: 60 } 
            }]
        }
        const item = new CONFIG.Item.documentClass(itemData, { parent: args[0].targets[0].actor });
        await MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
        const conc = args[0].actor.effects.find(e => e.label === "Concentrating");
        const effect = args[0].targets[0].actor.effects.find(e => e.label === "Blinding Smite" && !e.disabled);
        if (conc && effect) {
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
        } else if (conc) {
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [conc.id] });
        }
    }
} catch (err) {console.error("Blinding Smite Macro - ", err)}