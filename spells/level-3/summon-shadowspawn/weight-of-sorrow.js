// weight of sorrow

const lastArg = args[args.length - 1];

if (args[0] === "each") {
    const sourceTokenOrActor = await fromUuid(args[1]);
    const sourceTactor = sourceTokenOrActor.actor ? sourceTokenOrActor.actor : sourceTokenOrActor;
    const sourceParentUuid = sourceTactor.data.flags.parent;
    if (lastArg.actorUuid === args[1] || lastArg.actorUuid === sourceParentUuid) return;
    let effectData = {
        changes: [{ key: "data.attributes.movement.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "-20", priority: 20, }],
        label: "Weight of Sorrow",
        disabled: false,
        icon: "icons/creatures/magical/construct-golem-stone-blue.webp",
        flags: { dae: { specialDuration: ["TurnStart"] } },
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: lastArg.actorUuid, effects: [effectData] });
    await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: lastArg.actorUuid, effects: [lastArg.efData.id] });
}