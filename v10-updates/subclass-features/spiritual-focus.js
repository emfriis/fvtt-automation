try {
    if (args[0].tag != "DamageBonus" || !args[0].damageRoll.total || args[0].actor.classes?.bard?.system?.levels < 6 || args[0].item.type != "spell" || !args[0].item.system.damage.parts.find(p => !["temphp", "midinone", ""].includes(p[1].toLowerCase() && p[0].toLowerCase().includes("d"))) || !(args[0].item.flags?.["tidy5e-sheet"]?.parentClass.toLowerCase().includes("bard") || args[0].item.system.chatFlavor).toLowerCase().includes("bard") || (!args[0].item.flags?.["tidy5e-sheet"]?.parentClass && !args[0].item.system.chatFlavor && ["prepared", "always"].includes(args[0].item.system.preparation.mode))) return;
    let diceMult = args[0].isCritical ? 2: 1;
    return {damageRoll: `${diceMult}d6`, flavor: "Spiritual Focus"};
} catch (err) {console.error("Spiritual Focus Macro - ", err);}