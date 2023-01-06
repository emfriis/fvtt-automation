// hexblade's curse
// on use post effects
// on use pre attack
// damage bonus

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
    const target = lastArg.targets[0]?.actor;
    const effect = target?.effects?.find(e => e.data.label === "Hexblade's Curse" && e.data.origin === lastArg.uuid);
    if (!effect) return;
    const effectData = {
        changes: [
            { key: "flags.dnd5e.DamageBonusMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.${lastArg.item.name}`, priority: 20 },
            { key: "flags.midi-qol.onUseMacroName", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.${lastArg.item.name}, preAttackRoll`, priority: 20 },
            { key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: effect.uuid, priority: 20, }
        ],
        origin: lastArg.uuid,
        disabled: false,
        flags: { dae: { itemData: lastArg.item, stackable: ["noneName"] } },
        icon: "icons/weapons/swords/greatsword-evil-green.webp",
        label: "Hexblade's Curse Bonus Damage",
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
    const newEffect = tactor.effects.find(e => e.data.label === "Hexblade's Curse Bonus Damage" && e.data.origin === lastArg.uuid);
    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: target.uuid, updates: [{ _id: effect.id, changes: [{ key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: newEffect.uuid, priority: 20 }].concat(effect.data.changes) }] });
}

if (args[0].tag === "OnUse" && args[0].macroPass === "preAttackRoll") {
    if (!["mwak", "rwak", "msak", "rsak"].includes(lastArg.item.data.actionType)) return;
    if (!lastArg.targets.find(t => t?.actor?.data?.flags["midi-qol"]?.hexbladesCurse?.includes(lastArg.tokenId))) return;
    let effectData = {
        label: "Hexblade's Curse Critical Bonus",
        icon: "icons/weapons/swords/greatsword-evil-green.webp",
        origin: lastArg.uuid,
        disabled: false,
        flags: { dae: { specialDuration: ["1Attack"] } },
        changes: [
            { key: "flags.dnd5e.weaponCriticalThreshold", mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE, value: 19, priority: 20 },
            { key: "flags.dnd5e.spellCriticalThreshold", mode: CONST.ACTIVE_EFFECT_MODES.UPGRADE, value: 19, priority: 20 }
        ]
    };
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
}

if (args[0].tag === "DamageBonus") {
    if (!["mwak", "rwak", "msak", "rsak"].includes(lastArg.item.data.actionType)) return;
    if (!lastArg.targets.find(t => t?.actor?.data?.flags["midi-qol"]?.hexbladesCurse?.includes(lastArg.tokenId))) return;
    return { damageRoll: `${tactor.data.data.attributes.prof}[${lastArg.item.data.damage.parts[0][1]}]`, flavor: `Hexblade's Curse` };
}