// divine intervention
// on use
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse") {
    if (tactor.data.flags["midi-qol"].divineIntervention) return ui.notifications.warn(`Not enough time has elapsed since your deity's last intervention (${tactor.data.flags["midi-qol"].divineIntervention} Long Rests Remaining)`);
    const actorData = tactor.getRollData();
    const classLevel = actorData.classes.cleric?.levels;
    const roll = new Roll(`1d100`).evaluate({ async: false });
    if (game.dice3d) game.dice3d.showForRoll(roll);

    if (classLevel <= roll.total && classLevel < 20) return ChatMessage.create({ content: `${tactor.name}'s deity does not intervene. Perhaps next time...` });
    ChatMessage.create({ content: `${tactor.name}'s deity intervenes!` });
    const effectData = {
        label: "Divine Intervention Recharge",
        icon: "icons/magic/light/explosion-beam-impact-silhouette.webp",
        changes: [
            { key: `flags.midi-qol.divineIntervention`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: 7, priority: 20 },
            { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "", priority: 20 },
        ],
        origin: args[0].uuid,
        disabled: false,
        flags: { "dae": { itemData: lastArg.item, token: tactor.uuid, specialDuration: ["longRest"], } },
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
}

if (args[0] === "off") {
    const nextTime = Number(lastArg.efData.changes.find(c => c.key === `flags.midi-qol.divineIntervention`).value) - 1;
    if (nextTime == 0) return;
    const effectData = {
        label: "Divine Intervention Recharge",
        icon: "icons/magic/light/explosion-beam-impact-silhouette.webp",
        changes: [
            { key: `flags.midi-qol.divineIntervention`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: nextTime, priority: 20 },
            { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "", priority: 20 },
        ],
        origin: lastArg.efData.origin,
        disabled: false,
        flags: { "dae": { itemData: lastArg.efData.flags.dae.itemData, token: lastArg.efData.flags.dae.token, specialDuration: ["longRest"], } },
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
}