// moonbeam
// macro.execute - Moonbeam @item.level @attributes.spelldc
// aura - all, apply effect, only apply during current turn, only trigger once per turn

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const template = canvas.templates.placeables.find(i => i.data.flags?.ActiveAuras?.IsAura[0]?.data?.origin === lastArg.efData.origin);
  
function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

if (args[0] === "on") {
    if (token.data?.elevation > template.data.flags?.levels?.elevation + 40 || token.data?.elevation + token?.losHeight < template.data.flags?.levels?.elevation) {
        await wait (100);
        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [lastArg.effectId] });
        return;
    }

    let isShapechanger = tactor.data.data.details?.type?.subtype?.toLowerCase() === "shapechanger";
    if (isShapechanger) {
        const effectData = {
            changes: [{ key: "flags.midi-qol.disadvantage.ability.save.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
            disabled: false,
            flags: { dae: { specialDuration: ["isSave"] } },
            label: `Moonbeam Save Disadvantage`,
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
    }

    let damageDice = `${args[1]}d10`;
    if (!damageDice) return;
    
    await wait(100);
    let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
    if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, lastArg.tokenId, damageDice, "radiant", "magiceffect", "spelleffect", args[2], "con", "halfdam");
    
    await wait (100);
    await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [lastArg.effectId] });
}

/*
// moonbeam
// macro.execute - Moonbeam @spellLevel @attributes.spelldc
// aura - all, apply effect, only apply during current turn, only trigger once per turn

if (!game.modules.get("ActiveAuras")?.active) {
    ui.notifications.error("ActiveAuras is not enabled");
    return;
}
  
if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    return await AAhelpers.applyTemplate(args);
}
*/