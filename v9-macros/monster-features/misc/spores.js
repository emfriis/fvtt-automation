// spores
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "on" && !tactor.data.data.traits.ci.value.includes("poisoned")) {
    let effectData = {
        label: "Spores Damage",
        icon: "icons/magic/earth/orb-stone-smoke-teal.webp",
        origin: lastArg.efData.origin,
        disabled: false,
        changes: [{ key: `macro.execute`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "ApplyDamage self self 1d10 poison", priority: 20 }],
        flags: { dae: { macroRepeat: "startEveryTurn" } },
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
    let effect = tactor.effects.find(e => e.data.origin === lastArg.efData.origin && e.data.label !== lastArg.efData.label);
    if (effect) {
        const changes = [{ key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: effect.uuid, priority: 20, }];
        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: lastArg.efData._id, changes: changes.concat(lastArg.efData.changes) }] });
    }
}