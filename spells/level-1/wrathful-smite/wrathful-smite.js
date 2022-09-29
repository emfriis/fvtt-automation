// wrathful smite

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const sourceToken = canvas.tokens.get(args[1]);
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
                const type = removalCheck ? "abil" : "save";
                const rollOptions = { chatMessage: true, fastForward: true };
                const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: type, targetUuid: targetToken.uuid, ability: ability, options: rollOptions });
                if (game.dice3d) game.dice3d.showForRoll(roll);

                if (roll.total >= saveDc) {
                    let fear = tactor.effects.find(i => i.data === lastArg.efData);
		            if (fear) await tactor.deleteEmbeddedDocuments("ActiveEffect", [fear.id]);
                } else {
                    if (roll.total < saveDc) ChatMessage.create({ content: `${targetToken.name} fails the roll for ${item.name}, still has the ${condition} condition.` });
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
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: token.actor.uuid, effects: effectData });
}

if (lastArg.tag === "DamageBonus") {
    if (!["mwak"].includes(lastArg.item.data.actionType) || lastArg.hitTargetUuids.length < 1) return {};
    let tokenOrActorTarget = await fromUuid(lastArg.hitTargetUuids[0]);
    let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
    let spellDC = tactor.data.data.attributes.spelldc;
    let conc = tactor.effects.find(i => i.data.label === game.i18n.localize("Concentrating"));
    let spellUuid = getProperty(tactor.data.flags, "midi-qol.spellId");
    let spellItem = await fromUuid(getProperty(tactor.data.flags, "midi-qol.spellId"));
    let itemName = game.i18n.localize(spellItem.name);
    let damageType = "psychic";
    let effectData = [{
        changes: [
            { key: `macro.itemMacro.GM`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: lastArg.tokenId, priority: 20 },
            { key: `flags.midi-qol.fear`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: lastArg.actorUuid, priority: 20 },
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
        const resist = ["Brave", "Fear Resilience"];
        const getResist = tactorTarget.items.find(i => resist.includes(i.name)) || tactorTarget.effects.find(i => resist.includes(i.data.label));
        const rollOptions = getResist ? { chatMessage: true, fastForward: true, advantage: true } : { chatMessage: true, fastForward: true };
        const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: "save", targetUuid: tactorTarget.uuid, ability: "wis", options: rollOptions });
        if (game.dice3d) game.dice3d.showForRoll(roll);
        if (roll.total < spellDC) {
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: effectData });
        }
        let concUpdate = await getProperty(tactor.data.flags, "midi-qol.concentration-data.targets");
        await concUpdate.push({ tokenUuid: tokenOrActorTarget.uuid, actorUuid: tactorTarget.uuid });
        await tactor.setFlag("midi-qol", "concentration-data.targets", concUpdate);
    }

    const diceMult = args[0].isCritical ? 2: 1;
    return { damageRoll: `${diceMult}d6[${damageType}]`, flavor: `(${itemName} (${CONFIG.DND5E.damageTypes[damageType]}))` };
}

if (args[0] === "each" && lastArg.efData.disabled === false && token !== sourceToken) {
    const targetToken = await fromUuid(lastArg.tokenUuid);
    const condition = "Frightened";
    const item = await fromUuid(lastArg.efData.origin);
    attemptRemoval(targetToken, condition, item);
}