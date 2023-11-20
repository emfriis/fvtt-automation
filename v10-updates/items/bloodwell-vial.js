try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects" || args[0].item.system.attunement == 1) return;
    const usesItem = args[0].actor.items.find(i => i.name == "Font of Magic" && i.system.uses.value);
    if (!usesItem) return;
    let roll_results = `<div><i>${Math.min(usesItem.system.uses.max, usesItem.system.uses.value + 5) - usesItem.system.uses.value} Sorcery Points restored.</i></div>`;
    const chatMessage = game.messages.get(args[0].itemCardId);
    let content = duplicate(chatMessage.content);
    const replaceString = `<div class="midi-qol-saves-display"><div class="end-midi-qol-saves-display">${roll_results}`;
    content = content.replace(/<div class="midi-qol-saves-display">[\s\S]*<div class="end-midi-qol-saves-display">/g, replaceString);
    chatMessage.update({ content: content });
    await usesItem.update({ "system.uses.value": Math.min(usesItem.system.uses.max, usesItem.system.uses.value + 5) });
} catch (err) {console.error("Bloodwell Vial Macro - ", err)}