// branding smite
// on use

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const tokenD = canvas.tokens.get(lastArg.tokenId);
const actorD = tokenD.actor;
const gameRound = game.combat ? game.combat.round : 0;
const spellDC = actorD.data.data.attributes.spelldc;

if (args[0].tag === "OnUse") {
    let itemD = lastArg.item;
    let effectData = [{
        changes: [
            { key: "flags.dnd5e.DamageBonusMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.${itemD.name}`, priority: 20 },
            { key: "flags.midi-qol.BrandingSmite.Damage", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: `${lastArg.spellLevel}`, priority: 20 },
            { key: "flags.midi-qol.itemDetails", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: `${lastArg.uuid}`, priority: 20 }
        ],
        origin: lastArg.uuid,
        disabled: false,
        duration: { rounds: 1, startRound: gameRound, startTime: game.time.worldTime },
        flags: { dae: { itemData: itemD, specialDuration: ["1Hit"] } },
        icon: itemD.img,
        label: game.i18n.localize(itemD.name)
    }];
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tokenD.actor.uuid, effects: effectData });
}
if (args[0].tag === "DamageBonus") {
    if (!["mwak"].includes(lastArg.item.data.actionType)) return {};
    let tokenD = canvas.tokens.get(lastArg.tokenId);
    let itemUuid = getProperty(actorD.data.flags, "midi-qol.itemDetails");
    let itemD = await fromUuid(itemUuid);
    let target = canvas.tokens.get(lastArg.hitTargets[0].id);
    let spellLevel = getProperty(actorD.data.flags, "midi-qol.BrandingSmite.Damage");
    let damageType = "radiant";
    let damageDice = await new game.dnd5e.dice.DamageRoll(`${spellLevel}d6[${damageType}]`, actorD.getRollData(), { critical: lastArg.isCritical }).evaluate({ async: true });
    let invisNames = ["Invisible", "Invisibility"];
    let invis = target.actor.effects.find(i => invisNames.includes(i.data.label));
    let conc = tokenD.actor.effects.find(i => i.data.label === game.i18n.localize("Concentrating"));
    if (conc) {
        let concUpdate = await getProperty(actorD.data.flags, "midi-qol.concentration-data.targets");
        await concUpdate.push({ tokenUuid: target.document.uuid, actorUuid: target.actor.uuid });
        await actorD.setFlag("midi-qol", "concentration-data.targets", concUpdate);
    }
    if (invis) {
        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: target.actor.uuid, effects: [invis.id] });        
    } else if (target.data.hidden) {
        if(!(game.modules.get("warpgate")?.active)) return {};
        let updates = {
            token: { hidden: false }
        }
        let mutateCallbacks = "";
        await warpgate.mutate(target.document, updates, mutateCallbacks, { permanent: true });
    }
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
        origin: itemUuid,
        disabled: false,
        duration: { rounds: 10, startRound: gameRound, startTime: game.time.worldTime },
        icon: itemD.img,
        label: game.i18n.localize(itemD.name)
    }];
    let branded = target.actor.effects.find(i => i.data.label === game.i18n.localize(itemD.name));
    if (!branded) await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: effectData });
    return { damageRoll: damageDice.formula, flavor: `(${game.i18n.localize(itemD.name)} (${CONFIG.DND5E.damageTypes[damageType]}))` };
}