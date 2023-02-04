// black tentacles
// macro.execute - BlackTentacles @attributes.spelldc
// aura - all, check height, apply effect
  
const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const template = canvas.templates.placeables.find(i => i.data.flags?.ActiveAuras?.IsAura[0]?.data?.origin === lastArg.efData.origin);
  
function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

if ((args[0] === "on" && lastArg.tokenId === game.combat?.current.tokenId && tactor.data.flags["midi-qol"].blackTentaclesTime !== `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`) || args[0] === "each") {
    if (token?.data?.elevation > template?.data?.flags?.levels?.elevation + 20 || token?.data?.elevation + token?.losHeight < template?.data?.flags?.levels?.elevation) {
        await wait(100);
        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [lastArg.effectId] });
        return;
    };
    if (!args[1]) return;
    
    const applyDamage = game.macros.find(m => m.name === "ApplyDamage");
    if (!tactor.effects.find(e => e.data.label === "Restrained" && e.data.origin === lastArg.efData.origin)) {
        const save = await USF.socket.executeAsGM("attemptSaveDC", { actorUuid: tactor.uuid, saveName: `${lastArg.efData.label} Save`, saveImg: `systems/dnd5e/icons/spells/vines-eerie-2.jpg`, saveType: "save", saveDC: args[1], saveAbility: "dex", magiceffect: true, spelleffect: true });
        if (!save && applyDamage) {
            await applyDamage.execute("ApplyDamage", lastArg.tokenId, lastArg.tokenId, "3d6", "bludgeoning", "magiceffect", "spelleffect");
            const effectData = {
                changes: [
                    { key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `Convenient Effect: Restrained`, priority: 20, },
                    { key: "macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `AttemptRemoval ${args[1]} dex/str check opt`, priority: 20, },
                ],
                disabled: false,
                origin: lastArg.uuid,
                flags: { dae: { macroRepeat: "startEveryTurn", }, magiceffect: true, spelleffect: true, },
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
        }
    } else {
        if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, lastArg.tokenId, "3d6", "bludgeoning", "magiceffect", "spelleffect");
    }
    await tactor.setFlag("midi-qol", "blackTentaclesTime", `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`);                

} else if (args[0] === "off") { // leaving aura vertically requires manual effect removal
    let effect = tactor.effects.find(i => i.data.label === "Restrained" && i.data.origin === lastArg.uuid);
    if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
};

/*
// black tentacles
// macro.execute - BlackTentacles @attributes.spelldc
// aura - all, check height, apply effect

if (!game.modules.get("ActiveAuras")?.active) {
    ui.notifications.error("ActiveAuras is not enabled");
    return;
};
  
if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    return await AAhelpers.applyTemplate(args);
};
*/