try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "preActiveEffects") return await game.modules.get("ActiveAuras")?.api.AAHelpers.applyTemplate(args);
} catch (err) {console.error("Template Appply Aura - ", err)}