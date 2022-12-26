// blinding smite
// on use

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const gameRound = game.combat ? game.combat.round : 0;
const durationType = lastArg.item.data.duration.units;
const duration = durationType === "second" ? lastArg.item.data.duration.value * 6 : durationType === "minute" ? lastArg.item.data.duration.value * 10 : durationType === "hour" ? lastArg.item.data.duration.value * 600 : lastArg.item.data.duration.value;

if (lastArg.tag === "OnUse") {
    let item = lastArg.item;
    let effectData = [{
        changes: [
            { key: "flags.dnd5e.DamageBonusMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.${item.name}`, priority: 20 },
            { key: "flags.midi-qol.spellId", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.uuid, priority: 20 }
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
    if (!["mwak"].includes(lastArg.item.data.actionType)) return;
    let tokenTarget = lastArg.hitTargets[0];
    let tokenOrActorTarget = await fromUuid(lastArg.hitTargetUuids[0]);
    let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
    let spellDC = tactor.data.data.attributes.spelldc;
    let conc = tactor.effects.find(i => i.data.label === game.i18n.localize("Concentrating"));
    let spellUuid = getProperty(tactor.data.flags, "midi-qol.spellId");
    let spellItem = await fromUuid(getProperty(tactor.data.flags, "midi-qol.spellId"));
    let ability = "con";
    let damageType = "radiant";
    const senses = tactorTarget.data.data.attributes.senses;
    let visionRange = Math.max(senses.blindsight, senses.tremorsense, 0);
    let effectData = [{
        changes: [
            { key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Blinded", priority: 99 - visionRange },
            { key: "ATL.flags.perfect-vision.sightLimit", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 99 - visionRange, value: visionRange, },
            { key: `macro.execute`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `AttemptRemoval ${spellDC} con save auto`, priority: 99 - visionRange },
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: conc.uuid, priority: 99 - visionRange },
            { key: "ATCV.blinded", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "1" },
            { key: "ATCV.conditionBlinded", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "true" },
            { key: "ATCV.conditionType", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "sense" },
            { key: "ATCV.conditionTargets", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "" }, 
            { key: "ATCV.conditionSources", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "" }
        ],
        origin: spellUuid,
        disabled: false,
        icon: spellItem.img,
        label: spellItem.name
    }];

    if (conc) {
        const itemData = {
            name: `${spellItem.name} Save`,
            img: spellItem.img,
            type: "feat",
            flags: {
                midiProperties: { magiceffect: true, spelleffect: true, }
            },
            data: {
                activation: { type: "none", },
                target: { type: "self", },
                actionType: "save",
                save: { dc: spellDC, ability: ability, scaling: "flat" },
            }
        }
        await USF.socket.executeAsGM("createItem", { actorUuid: tactorTarget.uuid, itemData: itemData });
        let saveItem = await tactorTarget.items.find(i => i.name === itemData.name);
        let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
        await USF.socket.executeAsGM("deleteItem", { itemUuid: saveItem.uuid });
        
        if (saveWorkflow.failedSaves.size) {
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: effectData });
            let concUpdate = await getProperty(tactor.data.flags, "midi-qol.concentration-data.targets");
            await concUpdate.push({ tokenUuid: tokenOrActorTarget.uuid, actorUuid: tactorTarget.uuid });
            await tactor.setFlag("midi-qol", "concentration-data.targets", concUpdate);
        }
    }

    const diceMult = args[0].isCritical ? 6 : 3;
    return { damageRoll: `${diceMult}d8[${damageType}]`, flavor: `(${spellItem.name} (${CONFIG.DND5E.damageTypes[damageType]}))` };
}