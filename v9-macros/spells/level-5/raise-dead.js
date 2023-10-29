// raise dead
// on use pre effects
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse") {
    for (let t = 0; t < args[0].targets.length; t++) {
        let target = args[0].targets[t];
        let tactor = target?.actor;
        if (!tactor || tactor.data.data.attributes.hp.value || !tactor.effects.find(e => e.data.label === "Dead")) return;
        await USF.socket.executeAsGM("updateActor", { actorUuid: tactor.uuid, updates: {"data.attributes.hp.value" : 1} });
    } 
}

if (args[0] === "off") {
    const nextTime = Number(lastArg.efData.changes.find(c => c.key === `flags.midi-qol.raiseDead`).value) - 1;
    if (nextTime == 0) return;
    const effectData = {
        label: "Raise Dead",
        icon: "systems/dnd5e/icons/spells/heal-royal-2.jpg",
        changes: [
            { key: `flags.midi-qol.raiseDead`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: nextTime, priority: 20 },
            { key: `data.bonuses.All-Attacks`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `-${nextTime}`, priority: 20 },
            { key: `data.bonuses.abilities.save`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `-${nextTime}`, priority: 20 },
            { key: `data.bonuses.abilities.check`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `-${nextTime}`, priority: 20 },
            { key: `data.bonuses.abilities.skill`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `-${nextTime}`, priority: 20 },
            { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "", priority: 20 },
        ],
        origin: lastArg.efData.origin,
        disabled: false,
        flags: { "dae": { itemData: lastArg.efData.flags.dae.itemData, token: lastArg.efData.flags.dae.token, specialDuration: ["longRest"], } },
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
}