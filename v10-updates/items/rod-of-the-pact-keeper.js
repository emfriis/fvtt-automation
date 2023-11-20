try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects" || args[0].item.system.attunement == 1) return;
    let spellUpdate = new Object();
    spellUpdate["system.spells.pact.value"] = Math.min(args[0].actor.system.spells.pact.max, args[0].actor.system.spells.pact.value + 1);
    await args[0].actor.update(spellUpdate);
} catch (err) {console.error("Rod of the Pact Keeper Macro - ", err)}