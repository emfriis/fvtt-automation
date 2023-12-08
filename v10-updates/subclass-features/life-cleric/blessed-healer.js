try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects" || args[0].item.type != "spell" || args[0].spellLevel == 0 || args[0].workflow.defaultDamageType.toLowerCase() != "healing" || !args[0].targets.find(t => t.actor.uuid != args[0].actor.uuid)) return;
    const itemData = {
        name: "Blessed Healer",
        img: "icons/magic/light/explosion-star-teal.webp",
        type: "feat",
        system: {
            activation: { type: "special" },
            target: { type: "self" },
            actionType: "healing",
            damage: { parts: [[`${2 + args[0].spellLevel}`, "healing"]] }
        },
        flags: { autoanimations: { isEnabled: false } }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: args[0].actor });
    await MidiQOL.completeItemUse(item, {}, { showFullCard: true, createWorkflow: true, configureDialog: false });
} catch (err) {console.error("Blessed Healer Macro - ", err)}