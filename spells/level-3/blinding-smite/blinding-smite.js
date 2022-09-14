// blinding smite

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const tokenD = canvas.tokens.get(lastArg.tokenId);
const actorD = tokenD.actor;
const gameRound = game.combat ? game.combat.round : 0;

if (lastArg.tag === "OnUse") {
    let itemD = lastArg.item;
    let itemName = game.i18n.localize(itemD.name);
    let effectData = [{
        changes: [
            { key: "flags.dnd5e.DamageBonusMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.${itemName}`, priority: 20 },
            { key: "flags.midi-qol.spellId", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.uuid, priority: 20 }
        ],
        origin: lastArg.uuid,
        disabled: false,
        duration: { rounds: 10, startRound: gameRound, startTime: game.time.worldTime },
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
    let spellUuid = getProperty(actorD.data.flags, "midi-qol.spellId");
    let spellItem = await fromUuid(getProperty(actorD.data.flags, "midi-qol.spellId"));
    let itemName = game.i18n.localize(spellItem.name);
    let damageType = "radiant";
    let effectData = [{
        changes: [
            { key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Blinded", priority: 20 },
            { key: `flags.midi-qol.OverTime`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: `turn=end,label=${itemName},saveDC=${spellDC},saveAbility=con,saveMagic=true`, priority: 20 },
            { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "", priority: 20 },
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: conc.uuid, priority: 20 },
            { key: "ATCV.blinded", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99, value: "1" },
            { key: "ATCV.conditionBlinded", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99, value: "true" },
            { key: "ATCV.conditionType", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99, value: "sense" },
            { key: "ATCV.conditionTargets", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99, value: "" }, 
            { key: "ATCV.conditionSources", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99, value: "" }
        ],
        origin: spellUuid,
        flags: {
            "dae": { itemData: spellItem.data, token: target.actor.uuid }
        },
        disabled: false,
        duration: { rounds: 10, startRound: gameRound, startTime: game.time.worldTime },
        icon: spellItem.img,
        label: itemName
    }];

    if (conc) {
        const flavor = `${"Blinded"} (via ${itemName}) : ${CONFIG.DND5E.abilities["con"]} ${"save"} vs DC${spellDC}`;
        let save = (await target.actor.rollAbilitySave("wis", { flavor })).total;
        if (save < spellDC) {
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: effectData });
        }
        let concUpdate = await getProperty(actorD.data.flags, "midi-qol.concentration-data.targets");
        await concUpdate.push({ tokenUuid: target.document.uuid, actorUuid: target.actor.uuid });
        await actorD.setFlag("midi-qol", "concentration-data.targets", concUpdate);
    }

    const diceMult = args[0].isCritical ? 6 : 3;
    return { damageRoll: `${diceMult}d8[${damageType}]`, flavor: `(${itemName} (${CONFIG.DND5E.damageTypes[damageType]}))` };
}

if (args[0] === "on" && !actorD.data.data.traits.ci.value.includes("blinded")) {
    const token = await fromUuid(lastArg.tokenUuid);
    const senses = actorD.data.data.attributes.senses;
    let visionRange = Math.max(senses.blindsight, senses.tremorsense, 0);
    token.setFlag('perfect-vision', 'sightLimit', visionRange);
}

if (args[0] === "off" && !actorD.effects.find(i => i.data.label === "Blinded")) {
    const token = await fromUuid(lastArg.tokenUuid);
    token.setFlag('perfect-vision', 'sightLimit', null);
}