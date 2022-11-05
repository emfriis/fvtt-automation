const lastArg = args[args.length - 1];
const token = await fromUuid(lastArg.tokenUuid);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "on") {
    const senses = tactor.data.data.attributes.senses;
    let visionRange = Math.max(senses.blindsight, senses.tremorsense, 0);
    const effectData = [{
        changes: [
        { key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "Convenient Effect: Blinded", },
        { key: "ATL.flags.perfect-vision.sightLimit", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 99 - visionRange, value: `${visionRange}`, },
        { key: "ATCV.blinded", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "1", },
        { key: "ATCV.conditionType", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "sense", },
        { key: "ATCV.conditionBlinded", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "true", },
        { key: "ATCV.conditionTargets", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "", },
        { key: "ATCV.conditionSources", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "", },
        ],
        origin: lastArg.uuid,
        disabled: false,
    }];
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: effectData });
}

if (args[0] === "off") {
    let blind = tactor.effects.find(i => i.data.label === "Blinded" && i.data.origin === lastArg.uuid);
    if (blind) await tactor.deleteEmbeddedDocuments("ActiveEffect", [blind.id]);
}