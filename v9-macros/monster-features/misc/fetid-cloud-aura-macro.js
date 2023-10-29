// fetid cloud
// aura effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "each" && !tactor.data.data.traits.ci.value.includes("poisoned")) {
    const save = await USF.socket.executeAsGM("attemptSaveDC", { actorUuid: tactor.uuid, saveName: `${lastArg.efData.label} Save`, saveImg: lastArg.efData.icon, saveType: "save", saveDC: 12, saveAbility: "con" });
    if (save) return;
    let effectData = {
        label: "Poisoned",
        disabled: false,
        flags: { dae: { specialDuration: ["turnStart"] } },
        changes: [
            { key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Poisoned", priority: 20 },
            { key: `flags.midi-qol.noReaction`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 },
        ],
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
}