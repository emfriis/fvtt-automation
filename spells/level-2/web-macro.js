// web
// macro.execute - Grease @attributes.spelldc
// aura - all, check height, apply effect
  
const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const template = canvas.templates.placeables.find(i => i.data.flags?.ActiveAuras?.IsAura[0]?.data?.origin === lastArg.efData.origin);
  
function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

if (args[0] === "on" || args[0] === "each") {
    if (token?.data?.elevation > template?.data?.flags?.levels?.elevation + 5 || token?.data?.elevation + token?.losHeight < template?.data?.flags?.levels?.elevation) {
        await wait(100);
        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [lastArg.effectId] });
        return;
    };
    if (!saveDC) return;
    if (!tactor.effects.find(e => e.data.label === "Restrained" && e.data.origin === lastArg.efData.origin)) {
        const applyCondition = game.macros.find(m => m.name === "ApplyCondition");
        if (applyCondition) await applyCondition.execute("ApplyCondition", lastArg.tokenUuid, "save", "Restrained", args[1], "dex", "", "", "magiceffect", "spelleffect", `${args[1]},abil,str,opt`, "startEveryTurn", lastArg.efData.origin);
    }
} else if (args[0] === "off") {
    let effect = tactor.effects.find(e => e.data.label === "Restrained" && e.data.origin === lastArg.efData.origin);
    if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
};

/*
// web
// macro.execute - Web @attributes.spelldc
// aura - all, check height, apply effect

if (!game.modules.get("ActiveAuras")?.active) {
    ui.notifications.error("ActiveAuras is not enabled");
    return;
};
  
if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    return await AAhelpers.applyTemplate(args);
};
*/