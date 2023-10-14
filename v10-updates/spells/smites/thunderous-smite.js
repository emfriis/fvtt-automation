try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postActiveEffects") return;
    const effectData = { 
        changes: [{ key: "system.bonuses.mwak.damage", mode: 2, value: "2d6[thunder]", priority: 20 }], 
        disabled: false, 
        icon: "icons/magic/fire/dagger-rune-enchant-flame-purple.webp", 
        name: "Thunderous Smite Damage Bonus", 
        duration: { seconds: 60 }, 
        flags: { dae: { specialDuration: ["1Hit:mwak"] }, effectmacro: { dnd5e: { rollDamage: { script: 'try {\nworkflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);\nif (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;\nconst target = workflow.hitTargets.values().next().value?.actor;\nconst itemData = {\nname: "Thunderous Smite",\nimg: "icons/magic/fire/dagger-rune-enchant-flame-purple.webp",\ntype: "feat",\nsystem: {\nactivation: { type: "special" },\ntarget: { type: "self" },\nrange: { units: "self" },\nactionType: "save",\nsave: { ability: "str", dc: `${actor.system.attributes.spelldc}`, scaling: "flat" },\n}\n}\nconst item = new CONFIG.Item.documentClass(itemData, { parent: target });\nawait MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });\n} catch (err) {console.error("Thunderous Smite Macro - ", err)}' } } } }
    };
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    const conc = args[0].actor.effects.find(e => e.label === "Concentrating");
    const effect = args[0].actor.effects.find(e => e.label === "Thunderous Smite Damage Bonus");
    if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
} catch (err) {console.error("Thunderous Smite Macro - ", err)}

try {
    workflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);
    if (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;
    const target = workflow.hitTargets.values().next().value?.actor;
    const itemData = {
        name: "Thunderous Smite",
        img: "icons/magic/fire/dagger-rune-enchant-flame-purple.webp",
        type: "feat",
        system: {
            activation: { type: "special" },
            target: { type: "self" },
            range: { units: "self" },
            actionType: "save",
            save: { ability: "str", dc: `${actor.system.attributes.spelldc}`, scaling: "flat" },
        }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: target });
    await MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
} catch (err) {console.error("Thunderous Smite Macro - ", err)}

'try {\nworkflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);\nif (workflow.item.system.actionType !== "mwak" || !workflow.hitTargets.size) return;\nconst target = workflow.hitTargets.values().next().value?.actor;\nconst itemData = {\nname: "Thunderous Smite",\nimg: "icons/magic/fire/dagger-rune-enchant-flame-purple.webp",\ntype: "feat",\nsystem: {\nactivation: { type: "special" },\ntarget: { type: "self" },\nrange: { units: "self" },\nactionType: "save",\nsave: { ability: "str", dc: `${actor.system.attributes.spelldc}`, scaling: "flat" },\n}\n}\nconst item = new CONFIG.Item.documentClass(itemData, { parent: target });\nawait MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });\n} catch (err) {console.error("Thunderous Smite Macro - ", err)}'