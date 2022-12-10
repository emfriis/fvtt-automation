// searing-smite

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const tokenD = canvas.tokens.get(lastArg.tokenId);
const actorD = tokenD.actor;
const gameRound = game.combat ? game.combat.round : 0;
const durationType = lastArg.item.data.duration.units;
const duration = durationType === "second" ? lastArg.item.data.duration.value * 6 : durationType === "minute" ? lastArg.item.data.duration.value * 10 : durationType === "hour" ? lastArg.item.data.duration.value * 600 : lastArg.item.data.duration.value;

if (lastArg.tag === "OnUse") {
    let itemD = lastArg.item;
    let itemName = game.i18n.localize(itemD.name);
    let spellLevel = lastArg.spellLevel;
    let effectData = [{
        changes: [
            { key: "flags.dnd5e.DamageBonusMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.${itemName}`, priority: 20 },
            { key: "flags.midi-qol.spellLevel", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: spellLevel, priority: 20 },
            { key: "flags.midi-qol.spellId", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.uuid, priority: 20 }
        ],
        origin: lastArg.uuid,
        disabled: false,
        duration: { rounds: duration, startRound: gameRound, startTime: game.time.worldTime },
        flags: {
            "dae": { itemData: itemD, specialDuration: ["1Hit"] }
        },
        icon: itemD.img,
        label: itemName
    }];
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tokenD.actor.uuid, effects: effectData });
}

if (lastArg.tag === "DamageBonus") {
    if (!["mwak"].includes(lastArg.item.data.actionType)) return {};
    let target = canvas.tokens.get(lastArg.hitTargets[0].id);
    let spellDC = actorD.data.data.attributes.spelldc;
    let conc = actorD.effects.find(i => i.data.label === game.i18n.localize("Concentrating"));
    let spellLevel = getProperty(actorD.data.flags, "midi-qol.spellLevel");
    let spellUuid = getProperty(actorD.data.flags, "midi-qol.spellId");
    let spellItem = await fromUuid(getProperty(actorD.data.flags, "midi-qol.spellId"));
    let itemName = game.i18n.localize(spellItem.name);
    let damageType = "fire";
    let effectData = [{
        changes: [
            { key: `flags.midi-qol.OverTime`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: `turn=start,label=${itemName},damageRoll=1d6[${damageType}],saveDC=${spellDC},damageType=${damageType},saveAbility=con,saveMagic=true`, priority: 20 },
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: conc.uuid, priority: 20 }
        ],
        origin: spellUuid,
        flags: {
            "dae": { itemData: spellItem.data, token: target.actor.uuid }
        },
        disabled: false,
        icon: spellItem.img,
        label: itemName
    }];

    if (conc) {
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: effectData });
        let concUpdate = await getProperty(actorD.data.flags, "midi-qol.concentration-data.targets");
        await concUpdate.push({ tokenUuid: target.document.uuid, actorUuid: target.actor.uuid });
        await actorD.setFlag("midi-qol", "concentration-data.targets", concUpdate);
    }

    const diceMult = args[0].isCritical ? 2: 1;
    return { damageRoll: `${diceMult * spellLevel}d6[${damageType}]`, flavor: `(${itemName} (${CONFIG.DND5E.damageTypes[damageType]}))` };
}
