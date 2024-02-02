try {
    if (args[0].macroPass != "postActiveEffects" || args[0].item.type != "spell" || args[0].item.system.school != "con" || args[0].item.system.level < 1 || !["prepared", "always", "pact"].includes(args[0].item.system.preparation.mode)) return;
    const usesItem = args[0].actor.items.find(i => i.name == "Benign Transposition" && i.system.uses.value == 0);
    if (usesItem) await usesItem.update({ "system.uses.value": Math.max(1, usesItem.system.uses.max) });
} catch (err)  {console.error("Benign Transposition Macro - ", err)}