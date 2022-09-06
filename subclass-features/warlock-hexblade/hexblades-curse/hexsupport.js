async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
const target = canvas.tokens.get(lastArg.tokenId);
const itemD = lastArg.efData.flags.dae.itemData;
const tokenD = canvas.tokens.get(lastArg.efData.flags.dae.tokenId);

if (args[0] === "on") {
    let itemName = `${getProperty(tactor.data.flags, "midi-qol.hexEffect")} Life Monitor`;
    let primaryEffect = await tactor.effects.find(i => i.id === lastArg.effectId);    
    let effect = await tactor.effects.find(i => i.data.label === itemName);
    let effectData = [{
        origin: "",
        changes: [
            { key: "macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "HexSupport", priority: 20 },
            { key: "flags.midi-qol.hexEffect", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: getProperty(tactor.data.flags, "midi-qol.hexEffect"), priority: 20 },
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: primaryEffect.uuid, priority: 20 }
        ],
        flags: { dae: { tokenId: tokenD.id, itemData: itemD, specialDuration: ["zeroHP"] } },
        disabled: false,
        icon: itemD.img,
        label: itemName
    }];
    if (!effect) await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: effectData });
}

if ((lastArg["expiry-reason"] === "midi-qol:zeroHP") && (getProperty(tactor.data.flags, "midi-qol.hexEffect") === "Hexblade")) {
    console.log("Hexblade Zero HP run");
    let healType = "healing";
    let damageRoll = await new Roll(`@classes.warlock.levels[${healType}] + max(1, @abilities.cha.mod)`, tokenD.actor.getRollData()).evaluate({ async: true });
    await new MidiQOL.DamageOnlyWorkflow(tactor, target, damageRoll.total, healType, [tokenD], damageRoll, { flavor: `(${CONFIG.DND5E.healingTypes[healType]})`, itemData: itemD, itemCardId: "new" });
    let effect = tactor.effects.find(i => i.data.label === "Hexblade Life Tap");
    if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
    if ((!(game.modules.get("jb2a_patreon")?.active)) && (!(game.modules.get("sequencer")?.active))) return {};
    new Sequence()
        .effect()
        .file("jb2a.healing_generic.200px.purple")
        .atLocation(tokenD)
        .scaleToObject(tokenD.data.width * 2)
        .waitUntilFinished(-500)
    .play()
}

if ((lastArg["expiry-reason"] === "midi-qol:zeroHP") && (getProperty(tactor.data.flags, "midi-qol.hexEffect") === "Hexcurse")) {
    console.log("Hex Zero HP run");
    let effect = tactor.effects.find(i => i.data.label === "Hex Curse");
    if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
}

if (args[0] === "off") {
    let itemName = `${getProperty(tactor.data.flags, "midi-qol.hexEffect")} Life Monitor`;
    let effect = tactor.effects.find(i=> i.data.label === itemName);
    if(effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
}