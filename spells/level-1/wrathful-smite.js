// wrathful smite
// on use

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const sourceToken = canvas.tokens.get(args[1]);
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
    if (!["mwak"].includes(lastArg.item.data.actionType) || lastArg.hitTargetUuids.length < 1) return;
    let tokenTarget = lastArg.hitTargets[0];
    let tokenOrActorTarget = await fromUuid(lastArg.hitTargetUuids[0]);
    let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
    let spellDC = tactor.data.data.attributes.spelldc;
    let conc = tactor.effects.find(i => i.data.label === game.i18n.localize("Concentrating"));
    let spellUuid = getProperty(tactor.data.flags, "midi-qol.spellId");
    let spellItem = await fromUuid(getProperty(tactor.data.flags, "midi-qol.spellId"));
    let ability = "wis";
    let damageType = "psychic";
    let effectData = [{
        changes: [
            { key: `macro.execute`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `AttemptRemoval ${spellDC} wis abil opt`, priority: 20 },
            { key: `flags.midi-qol.fear`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: lastArg.tokenId, priority: 20 },
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: conc.uuid, priority: 20 }
        ],
        origin: spellUuid,
        flags: {
            "dae": { itemData: spellItem.data, token: tactorTarget.uuid, macroRepeat: "startEveryTurn" },
            "core": { statusId: "Frightened" }
        },
        disabled: false,
        icon: "icons/svg/terror.svg",
        label: "Frightened"
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
        await tactorTarget.createEmbeddedDocuments("Item", [itemData]);
        let saveItem = await tactorTarget.items.find(i => i.name === itemData.name);
        let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
        await tactorTarget.deleteEmbeddedDocuments("Item", [saveItem.id]);
        
        if (saveWorkflow.failedSaves.size) {
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: effectData });
            let concUpdate = await getProperty(tactor.data.flags, "midi-qol.concentration-data.targets");
            await concUpdate.push({ tokenUuid: tokenOrActorTarget.uuid, actorUuid: tactorTarget.uuid });
            await tactor.setFlag("midi-qol", "concentration-data.targets", concUpdate);
        }
    }

    const diceMult = args[0].isCritical ? 2: 1;
    return { damageRoll: `${diceMult}d6[${damageType}]`, flavor: `(${spellItem.name} (${CONFIG.DND5E.damageTypes[damageType]}))` };
}