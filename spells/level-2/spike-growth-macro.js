// spike growth
// macro.execute - SpikeGrowth
// aura - all, check height, apply effect

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const template = canvas.templates.placeables.find(i => i.data.flags?.ActiveAuras?.IsAura[0]?.data?.origin === lastArg.efData.origin);

function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

(async () => {
    if (args[0] === "on") {
        if (token?.data?.elevation > template?.data?.flags?.levels?.elevation + 5 || token?.data?.elevation + token?.losHeight < template?.data?.flags?.levels?.elevation) {
            await wait(100);
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [lastArg.effectId] });
            return;
        };

        await wait(100);
        const applyDamage = game.macros.find(m => m.name === "ApplyDamage");
        if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, lastArg.tokenId, "2d4", "piercing", "magiceffect", "spelleffect");
        
        await wait(100);
        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [lastArg.effectId] });
    }; 
})();

/*
// spike growth
// macro.execute - SpikeGrowth
// aura - all, check height, apply effect

if (!game.modules.get("ActiveAuras")?.active) {
    ui.notifications.error("ActiveAuras is not enabled");
    return;
};
  
if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    return await AAhelpers.applyTemplate(args);
};
*/