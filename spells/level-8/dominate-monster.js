// dominate monster
// on use post effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.macroPass === "postActiveEffects" && lastArg.spellLevel === 9) {

    for (let t = 0; t < lastArg.failedSaves.length; t++) {
        let target = lastArg.failedSaves[t];
        let tactorTarget = target.actor;
        if (!tactorTarget) continue;
        let effect = await tactorTarget.effects.find(e => e.data.label === "Dominated" && e.data.origin === lastArg.uuid);
        if (effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactorTarget.uuid, updates: [{ _id: effect.id, duration: { seconds: effect.data.duration.seconds * 8 } }] });
    }

    let conc = await tactor.effects.find(e => e.data.label === "Concentrating");
    if (conc) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: conc.id, duration: { seconds: conc.data.duration.seconds * 8 } }] });
}