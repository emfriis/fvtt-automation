// magical tinkering
// on use post effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const tokenTarget = lastArg.targets[0];
const tactorTarget = tokenTarget.actor;
const effect = tactorTarget.effects.find(e => e.data.label === "Magical Tinkering" && e.data.origin?.includes(tactor.uuid));

if (tactor.data.flags["midi-qol"]?.magicalTinkering) {
    let flag = await tactor.getFlag("midi-qol", "magicalTinkering");
    flag.push(effect.uuid);
    while (flag.length > Math.max(1, tactor.data.data.abilities.int.mod)) {
        let removeEffectUuid = flag.shift();
        let removeEffect;
        if (removeEffectUuid) removeEffect = await fromUuid(removeEffectUuid);
        if (removeEffect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: removeEffect.parent.uuid, effects: [removeEffect.id] });
    }
    await tactor.setFlag("midi-qol", "magicalTinkering", flag);
} else {
    await tactor.setFlag("midi-qol", "magicalTinkering", [effect.uuid]);
}