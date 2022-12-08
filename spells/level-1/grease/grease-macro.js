// grease
// macro.execute - Grease @attributes.spelldc
// aura - all, check height, apply effect
  
const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const template = canvas.templates.placeables.find(i => i.data.flags?.ActiveAuras?.IsAura[0]?.data?.origin === lastArg.efData.origin);
  
if ((args[0] === "on" || args[0] === "each") && !tactor.effects.find(i => i.data.label === "Prone")) {
    if (token?.data?.elevation > template?.data?.flags?.levels?.elevation + 5 || token?.data?.elevation + token?.losHeight < template?.data?.flags?.levels?.elevation) {
        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [lastArg.effectId] });
        return;
    };
    const applyCondition = game.macros.find(m => m.name === "ApplyCondition");
    if (applyCondition) await applyCondition.execute("ApplyCondition", lastArg.tokenUuid, "save", "Prone", args[1], "dex", "", "", "magiceffect", "spelleffect");
};

/*
// grease
// macro.execute - Grease @attributes.spelldc
// aura - all, check height, apply effect

if (!game.modules.get("ActiveAuras")?.active) {
    ui.notifications.error("ActiveAuras is not enabled");
    return;
};
  
if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    return await AAhelpers.applyTemplate(args);
};
*/