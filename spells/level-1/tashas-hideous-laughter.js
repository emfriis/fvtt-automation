// tasha's hideous laughter
// on use before save
// on use post save

const lastArg = args[args.length - 1];

if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0 && args[0].macroPass === "preSave") {
    const resist = ["Incapacitation Resilience"];
    for (let i = 0; i < lastArg.hitTargetUuids.length; i++) {
        let tokenOrActorTarget = await fromUuid(lastArg.targetUuids[i]);
        let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
        let getResist = tactorTarget.items.find(i => resist.includes(i.name)) || tactorTarget.effects.find(i => resist.includes(i.data.label));
        if (getResist) {
            const effectData = {
                changes: [
                    {
                        key: "flags.midi-qol.advantage.ability.save.all",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        value: 1,
                        priority: 20,
                    }
                ],
                disabled: false,
                flags: { dae: { specialDuration: ["isSave"] } },
                icon: args[0].item.img,
                label: `${args[0].item.name} Save Advantage`,
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
        }
    }
}

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