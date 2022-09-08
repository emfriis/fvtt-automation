// wrathful smite

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const tokenD = canvas.tokens.get(lastArg.tokenId);
const actorD = tokenD.actor;
const gameRound = game.combat ? game.combat.round : 0;

async function attemptRemoval(targetToken, condition, item) {
    if (game.dfreds.effectInterface.hasEffectApplied(condition, targetToken.uuid)) {
        new Dialog({
        title: `Use action to attempt to remove ${condition}?`,
        buttons: {
            one: {
            label: "Yes",
            callback: async () => {
                const caster = item.parent;
                const saveDc = caster.data.data.attributes.spelldc;
                const removalCheck = true;
                const ability = "wis";
                const type = removalCheck ? "check" : "save";
                const flavor = `${condition} (via ${item.name}) : ${CONFIG.DND5E.abilities[ability]} ${type} vs DC${saveDc}`;
                const rollResult = removalCheck
                ? (await targetToken.actor.rollAbilityTest(ability, { flavor })).total
                : (await targetToken.actor.rollAbilitySave(ability, { flavor })).total;

                if (rollResult >= saveDc) {
                game.dfreds.effectInterface.removeEffect({ effectName: condition, uuid: targetToken.uuid });
                } else {
                if (rollResult < saveDc) ChatMessage.create({ content: `${targetToken.name} fails the ${type} for ${item.name}, still has the ${condition} condition.` });
                }
            },
            },
            two: {
            label: "No",
            callback: () => {},
            },
        },
        }).render(true);
    }
}

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
    let damageType = "psychic";
    let effectData = [{
        changes: [
            { key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Frightened", priority: 20 },
            { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "", priority: 20 },
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: conc.uuid, priority: 20 }
        ],
        origin: spellUuid,
        flags: {
            "dae": { itemData: spellItem.data, token: target.actor.uuid, macroRepeat: "startEveryTurn" }
        },
        disabled: false,
        duration: { rounds: 10, startRound: gameRound, startTime: game.time.worldTime },
        icon: spellItem.img,
        label: itemName
    }];

    if (conc) {
        const flavor = `${"Frightened"} (via ${itemName}) : ${CONFIG.DND5E.abilities["wis"]} ${"save"} vs DC${spellDC}`;
        let save = (await target.actor.rollAbilitySave("wis", { flavor })).total;
        if (save < spellDC) {
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: effectData });
        }
        let concUpdate = await getProperty(actorD.data.flags, "midi-qol.concentration-data.targets");
        await concUpdate.push({ tokenUuid: target.document.uuid, actorUuid: target.actor.uuid });
        await actorD.setFlag("midi-qol", "concentration-data.targets", concUpdate);
    }

    const diceMult = args[0].isCritical ? 2: 1;
    return { damageRoll: `${diceMult}d6[${damageType}]`, flavor: `(${itemName} (${CONFIG.DND5E.damageTypes[damageType]}))` };
}

if (args[0] === "each") {
    const targetToken = await fromUuid(lastArg.tokenUuid);
    const condition = "Frightened";
    const item = await fromUuid(lastArg.efData.origin);
    attemptRemoval(targetToken, condition, item);
}