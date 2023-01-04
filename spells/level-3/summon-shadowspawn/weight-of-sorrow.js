// weight of sorrow

const lastArg = args[args.length - 1];

if (args[0] === "each") {
    const sourceItem = await fromUuid(lastArg.efData.origin)
    const sourceActor = sourceItem.parent;
    const sourceParentId = sourceActor.data.flags.parent;
    if (lastArg.actorUuid === sourceActor.uuid || lastArg.tokenId === sourceParentId) return;
    let effectData = {
        changes: [{ key: "data.attributes.movement.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "-20", priority: 20, }],
        label: "Weight of Sorrow",
        disabled: false,
        icon: "icons/creatures/magical/construct-golem-stone-blue.webp",
        flags: { dae: { specialDuration: ["turnStart"] } },
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: lastArg.actorUuid, effects: [effectData] });
}