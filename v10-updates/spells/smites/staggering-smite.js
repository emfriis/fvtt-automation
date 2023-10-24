//----------------------------

try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postActiveEffects") return;
    const effectData = { 
        changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: "4d6[psychic]", priority: 20 }], 
        disabled: false, 
        icon: "icons/magic/fire/dagger-rune-enchant-flame-strong-purple-pink.webp", 
        name: "Staggering Smite Damage Bonus", 
        duration: { seconds: 60 }, 
        flags: { dae: { specialDuration: ["1Hit:mwak"] }, effectmacro: { dnd5e: { rollDamage: { script: 'try {\nworkflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);\nif (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;\nconst target = workflow.hitTargets.values().next().value?.actor;\nconst itemData = {\nname: "Staggering Smite",\nimg: "icons/magic/fire/dagger-rune-enchant-flame-strong-purple-pink.webp",\ntype: "feat",\nflags: { midiProperties: { magiceffect: true } },\nsystem: {\nactivation: { type: "special" },\ntarget: { type: "self" },\nrange: { units: "self" },\nactionType: "save",\nsave: { ability: "wis", dc: `${actor.system.attributes.spelldc}`, scaling: "flat" },\n},\neffects: [{\nchanges: [{ key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: 1, priority: 20 }, { key: "flags.midi-qol.disadvantage.ability.all", mode: 0, value: 1, priority: 20 }, { key: "flags.midi-qol.disadvantage.skill.all", mode: 0, value: 1, priority: 20 }],\ndisabled: false,\ntransfer: false,\nisSuppressed: false,\nicon: "icons/magic/fire/dagger-rune-enchant-flame-strong-purple-pink.webp",\nname: "Staggering Smite",\nduration: { rounds: 1 },\nflags: { dae: { specialDuration: ["turnEnd"] } }\n}]\n}\nconst item = new CONFIG.Item.documentClass(itemData, { parent: target });\nawait MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });\nconst conc = actor.effects.find(e => e.label === "Concentrating");\nconst effect = target.effects.find(e => e.label === "Staggering Smite");\nif (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });\n} catch (err) {console.error("Staggering Smite Macro - ", err)}' } } } }
    };
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    const conc = args[0].actor.effects.find(e => e.label === "Concentrating");
    const effect = args[0].actor.effects.find(e => e.label === "Staggering Smite Damage Bonus");
    if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
} catch (err) {console.error("Staggering Smite Macro - ", err)}

try {
    workflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);
    if (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;
    const target = workflow.hitTargets.values().next().value?.actor;
    const itemData = {
        name: "Staggering Smite",
        img: "icons/magic/fire/dagger-rune-enchant-flame-strong-purple-pink.webp",
        type: "feat",
        flags: { midiProperties: { magiceffect: true } },
        system: {
            activation: { type: "special" },
            target: { type: "self" },
            range: { units: "self" },
            actionType: "save",
            save: { ability: "wis", dc: `${actor.system.attributes.spelldc}`, scaling: "flat" },
        },
        effects: [{ 
            changes: [{ key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: 1, priority: 20 }, { key: "flags.midi-qol.disadvantage.ability.all", mode: 0, value: 1, priority: 20 }, { key: "flags.midi-qol.disadvantage.skill.all", mode: 0, value: 1, priority: 20 }], 
            disabled: false, 
            transfer: false,
            isSuppressed: false,
            icon: "icons/magic/fire/dagger-rune-enchant-flame-strong-purple-pink.webp", 
            name: "Staggering Smite", 
            duration: { rounds: 1 },
            flags: { dae: { specialDuration: ["turnEnd"] } }
        }]
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: target });
    await MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
    const conc = actor.effects.find(e => e.label === "Concentrating");
    const effect = target.effects.find(e => e.label === "Staggering Smite");
    if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
} catch (err) {console.error("Staggering Smite Macro - ", err)}

'try {\nworkflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);\nif (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;\nconst target = workflow.hitTargets.values().next().value?.actor;\nconst itemData = {\nname: "Staggering Smite",\nimg: "icons/magic/fire/dagger-rune-enchant-flame-strong-purple-pink.webp",\ntype: "feat",\nflags: { midiProperties: { magiceffect: true } },\nsystem: {\nactivation: { type: "special" },\ntarget: { type: "self" },\nrange: { units: "self" },\nactionType: "save",\nsave: { ability: "wis", dc: `${actor.system.attributes.spelldc}`, scaling: "flat" },\n},\neffects: [{\nchanges: [{ key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: 1, priority: 20 }, { key: "flags.midi-qol.disadvantage.ability.all", mode: 0, value: 1, priority: 20 }, { key: "flags.midi-qol.disadvantage.skill.all", mode: 0, value: 1, priority: 20 }],\ndisabled: false,\ntransfer: false,\nisSuppressed: false,\nicon: "icons/magic/fire/dagger-rune-enchant-flame-strong-purple-pink.webp",\nname: "Staggering Smite",\nduration: { rounds: 1 },\nflags: { dae: { specialDuration: ["turnEnd"] } }\n}]\n}\nconst item = new CONFIG.Item.documentClass(itemData, { parent: target });\nawait MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });\nconst conc = actor.effects.find(e => e.label === "Concentrating");\nconst effect = target.effects.find(e => e.label === "Staggering Smite");\nif (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });\n} catch (err) {console.error("Staggering Smite Macro - ", err)}'

//-----------------------------

try {
    if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects" && args[0].item.type === "spell" && args[0].item.name === "Staggering Smite") {
        const effectData = { 
            changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: `4d6[${args[0].workflow.defaultDamageType}]`, priority: 20 }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "StaggeringSmite, postActiveEffects", priority: 20 }], 
            disabled: false, 
            icon: "icons/magic/fire/dagger-rune-enchant-flame-strong-purple-pink.webp", 
            name: "Staggering Smite Damage Bonus", 
            duration: { seconds: 60 }, 
            flags: { dae: { specialDuration: ["1Attack:mwak"] } }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.label === "Concentrating");
        const effect = args[0].actor.effects.find(e => e.label === "Staggering Smite Damage Bonus");
        if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
    } else if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects" && args[0].item.system.actionType === "mwak" && args[0].targets.length && args[0].damageRoll) {
        const itemData = {
            name: "Staggering Smite",
            img: "icons/magic/fire/dagger-rune-enchant-flame-strong-purple-pink.webp",
            type: "feat",
            flags: { midiProperties: { magiceffect: true } },
            system: {
                activation: { type: "special" },
                target: { type: "self" },
                range: { units: "self" },
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
                flags: { dae: { specialDuration: ["turnEnd"] } }
            }]
        }
        const item = new CONFIG.Item.documentClass(itemData, { parent: args[0].targets[0].actor });
        await MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
        const conc = args[0].actor.effects.find(e => e.label === "Concentrating");
        const effect = args[0].targets[0].actor.effects.find(e => e.label === "Staggering Smite");
        if (conc && effect) {
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
        } else if (conc) {
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [conc.id] });
        }
    }
} catch (err) {console.error("Staggering Smite Macro - ", err)}