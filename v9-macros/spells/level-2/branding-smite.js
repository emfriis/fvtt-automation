// branding smite
// on use

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (lastArg.tag === "OnUse") {
    let item = lastArg.item;
    const gameRound = game.combat ? game.combat.round : 0;
    const durationType = lastArg.item.data.duration.units;
    const duration = durationType === "second" ? lastArg.item.data.duration.value / 6 : durationType === "minute" ? lastArg.item.data.duration.value * 10 : durationType === "hour" ? lastArg.item.data.duration.value * 600 : lastArg.item.data.duration.value;
    let effectData = [{
        changes: [
            { key: "flags.dnd5e.DamageBonusMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.${item.name}`, priority: 20 },
            { key: "flags.midi-qol.smiteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.uuid, priority: 20 },
            { key: "flags.midi-qol.smiteLevel", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.spellLevel, priority: 20 },
        ],
        origin: lastArg.uuid,
        disabled: false,
        duration: { rounds: duration, startRound: gameRound, startTime: game.time.worldTime },
        flags: {
            "dae": { itemData: item, specialDuration: ["1Hit"] }
        },
        icon: item.img,
        label: item.name
    }];
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: effectData });
}

if (lastArg.tag === "DamageBonus") {
    if (!["mwak"].includes(lastArg.item.data.actionType) || lastArg.hitTargetUuids.length < 1) return;
    let tokenOrActorTarget = await fromUuid(lastArg.hitTargetUuids[0]);
    let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
    let conc = tactor.effects.find(i => i.data.label === game.i18n.localize("Concentrating"));
    let smiteUuid = getProperty(tactor.data.flags, "midi-qol.smiteUuid");
    let spellItem = await fromUuid(smiteUuid);
    let smiteLevel = parseInt(getProperty(tactor.data.flags, "midi-qol.smiteLevel"));
    let damageType = "radiant";
    let effectData = [{
        changes: [
            { key: `data.traits.ci.value`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "invisible", priority: 20 },
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: conc.uuid, priority: 20 },
            { key: `ATL.light.alpha`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "0.09", priority: 20 },
            { key: `ATL.light.animation`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: `{"type": "pulse", "speed":3, "intensity":3}`, priority: 20 },
            { key: `ATL.light.dim`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 5, priority: 20 },
            { key: `ATL.light.bright`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "0", priority: 20 },
            { key: `ATL.light.color`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "#b8fffa", priority: 20 }
        ],
        origin: smiteUuid,
        flags: {
            "dae": { itemData: spellItem.data, token: tactorTarget.uuid, stackable: "noneName" },
            "core": { statusId: spellItem.name }
        },
        disabled: false,
        icon: spellItem.img,
        label: spellItem.name + " Light",
    }];
    if (conc) {
        let invisEffects = tactorTarget.effects.filter(e => e.data.label === "Invisible").map(e => e.id);
        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactorTarget.uuid, effects: invisEffects });
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: effectData });
        let concUpdate = await getProperty(tactor.data.flags, "midi-qol.concentration-data.targets");
        await concUpdate.push({ tokenUuid: tokenOrActorTarget.uuid, actorUuid: tactorTarget.uuid });
        await tactor.setFlag("midi-qol", "concentration-data.targets", concUpdate);
    }

    const diceMult = lastArg.isCritical ? smiteLevel * 2 : smiteLevel;
    return { damageRoll: `${diceMult}d6[${damageType}]`, flavor: spellItem.name };
}