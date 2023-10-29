// tasha's hideous laughter
// on use post save

const lastArg = args[args.length - 1];

if (args[0].tag === "OnUse" && lastArg.failedSaveUuids.length > 0 && args[0].macroPass === "postSave") {
  for (let i = 0; i < lastArg.failedSaveUuids.length; i++) {
    let tokenOrActorTarget = await fromUuid(lastArg.failedSaveUuids[i]);
    let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
    if (!tactorTarget.effects.find(e => e.data.label === "Prone"));
    const effectData = {
      changes: [ { key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Prone", priority: 20, } ],
      disabled: false,
      label: "Prone",
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
  }
}