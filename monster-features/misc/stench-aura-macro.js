// stench

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const item = await fromUuid(lastArg.efData.origin);
const caster = item.parent;

if (tactor.data.data.traits.ci.value.includes("poisoned") || tactor.effects.find(e => e.data.label === `${caster.name} Stench Immunity`)) return;

if (args[0] === "each" && !lastArg.efData.disabled) {
    const save = await USF.socket.executeAsGM("attemptSaveDC", { actorUuid: lastArg.actorUuid, saveName: `${lastArg.efData.label} Save`, saveImg: lastArg.efData.icon, saveType: "save", saveDC: args[1], saveAbility: "con" });
    if (!save) {
        let effectData = {
            label: "Poisoned",
            origin: item.uuid,
            disabled: false,
            flags: { dae: { specialDuration: ["turnStart"] } },
            changes: [{ key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Poisoned", priority: 20 }],
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
    } else {
        let effectData = {
            label: `${caster.name} Stench Immunity`,
            origin: item.uuid,
            disabled: false,
            flags: { dae: { specialDuration: ["longRest"] } },
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
    }
}