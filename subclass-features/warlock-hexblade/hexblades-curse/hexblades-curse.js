async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
if (args[0].tag === "OnUse" && args[0].macroPass !== "preAttackRoll") {
    const target = canvas.tokens.get(lastArg.targets[0].id);
    const tokenD = canvas.tokens.get(lastArg.tokenId);
    const itemD = lastArg.item;
    const game_round = game.combat ? game.combat.round : 1;
    if (target.actor.effects.find(i => i.data.label === "Hexblade Life Tap")) return ui.notifications.warn(`Target is already under the effects of ${itemD.name}.`);
    return new Promise(async (resolve) => {
        await bonusDamage(target, itemD, tokenD, game_round);
        await lifeTap(target, itemD, tokenD, game_round);
        resolve();
        if ((!(game.modules.get("jb2a_patreon")?.active)) && (!(game.modules.get("sequencer")?.active))) return {};
        new Sequence()
            .effect()
            .file("jb2a.spell_projectile.skull.pinkpurple")
            .atLocation(tokenD)
            .stretchTo(target)
            .waitUntilFinished(-500)
            .play()
    });
}

async function bonusDamage(target, itemD, tokenD, game_round) {
    const effectData = {
        changes: [
            { key: "flags.midi-qol.hexbladeMark", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: target.id, priority: 20 },
            { key: "flags.dnd5e.DamageBonusMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.${itemD.name}`, priority: 20 },
            { key: "flags.midi-qol.onUseMacroName", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.${itemD.name}, preAttackRoll`, priority: 20 }
        ],
        origin: lastArg.uuid,
        disabled: false,
        flags: { dae: { itemData: itemD, specialDuration: ["zeroHP"] } },
        duration: { rounds: 10, startRound: game_round, startTime: game.time.worldTime },
        icon: "systems/dnd5e/icons/skills/affliction_04.jpg",
        label: `Hexblade Bonus Damage`
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tokenD.actor.uuid, effects: [effectData] });
}

async function lifeTap(target, itemD, tokenD, game_round) {
    let effect = await tokenD.actor.effects.find(i => i.data.label === "Hexblade Bonus Damage");
    let effectData = {
        label: `Hexblade Life Tap`,
        icon: "systems/dnd5e/icons/skills/affliction_01.jpg",
        origin: lastArg.uuid,
        disabled: false,
        duration: { rounds: 10, startRound: game_round, startTime: game.time.worldTime },
        flags: {
            "dae": { tokenId: tokenD.id, itemData: itemD }
        },
        changes: [
            { key: "macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "HexSupport", priority: 20 },
            { key: "flags.midi-qol.hexEffect", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "Hexblade", priority: 20 },
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: effect.uuid, priority: 20 }
        ]
    };
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });
}

if (args[0].tag === "OnUse" && args[0].macroPass === "preAttackRoll") {
    const target = canvas.tokens.get(lastArg.targets[0].id);
    const tokenD = canvas.tokens.get(lastArg.tokenId);
    const itemD = lastArg.item;
    if (!["mwak", "rwak", "msak", "rsak"].includes(lastArg.item.data.actionType)) return {};
    if (target.id !== getProperty(tokenD.actor.data.flags, "midi-qol.hexbladeMark")) return {};
    let effect = tokenD.actor.effects.find(i=> i.data.label === `Hexblade Critical`);
    let effectData = {
        label: `Hexblade Critical`,
        icon: "systems/dnd5e/icons/skills/affliction_01.jpg",
        origin: "",
        disabled: false,
        flags: { dae: { itemData: itemD.data, specialDuration: ["1Attack:mwak","1Attack:rwak","1Attack:msak","1Attack:msak","1Attack:rsak","turnEnd","zeroHP"] } },
        changes: [
            { key: "flags.dnd5e.weaponCriticalThreshold", mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE, value: 19, priority: 20 },
            { key: "flags.dnd5e.spellCriticalThreshold", mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE, value: 19, priority: 20 }
        ]
    };
    if (!effect) await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tokenD.actor.uuid, effects: [effectData] });
}

// Dropped Critical Only Dice are doubled
if (args[0].tag === "DamageBonus") {
    const target = canvas.tokens.get(lastArg.targets[0].id);
    const tokenD = canvas.tokens.get(lastArg.tokenId);
    if (!["mwak", "rwak", "msak", "rsak"].includes(lastArg.item.data.actionType)) return {};
    if (target.id !== getProperty(tokenD.actor.data.flags, "midi-qol.hexbladeMark")) return {};
    let damageType = lastArg.damageDetail[0].type;
    let damageNumber = await new game.dnd5e.dice.DamageRoll(`@prof[${damageType}]`, tokenD.actor.getRollData(), { critical: false }).evaluate({ async: true });
    return { damageRoll: damageNumber.formula, flavor: `(Hexblade Damage)`, damageList: lastArg.damageList };
}