// create bonfire
// macro.execute - CreateBonfire @details.level @details.cr @attributes.spelldc
// aura - all, check height, apply effect

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const template = canvas.templates.placeables.find(i => i.data.flags?.ActiveAuras?.IsAura[0]?.data?.origin === lastArg.efData.origin);

function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

if (args[0] === "on" || args[0] === "each") {
    if (token.data?.elevation > template.data.flags?.levels?.elevation + 5 || token.data?.elevation + token?.losHeight < template.data.flags?.levels?.elevation) {
        await wait (100);
        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [lastArg.effectId] });
        return;
    }

    let cantripDice = await args[1] !== "undefined" ? `${1 + Math.floor((args[1] + 1) / 6)}d8` : args[2] !== "undefined" ? `${1 + Math.floor((args[2] + 1) / 6)}d8` : undefined; 
    if (!cantripDice) return;

    await wait (100);
    let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
    if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, lastArg.tokenId, cantripDice, "fire", "magiceffect", "spelleffect", args[3], "dex", "nodam");
    
    await wait (100);
    await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [lastArg.effectId] });
}

/*
// create bonfire
// macro.execute - CreateBonfire @details.level @details.cr @attributes.spelldc
// aura - all, check height, apply effect

if (!game.modules.get("ActiveAuras")?.active) {
    ui.notifications.error("ActiveAuras is not enabled");
    return;
}
  
if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    return await AAhelpers.applyTemplate(args);
}
*/