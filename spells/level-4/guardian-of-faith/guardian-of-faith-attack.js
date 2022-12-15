// guardian of faith attack
// on use post effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
    let guardianDamage = tactor.getFlag("midi-qol", "guardianDamage");
    await tactor?.setFlag("midi-qol", "guardianDamage", (guardianDamage ?? 0) + args[0]?.damageList[0]?.appliedDamage);
    if ((guardianDamage ?? 0) + args[0]?.damageList[0]?.appliedDamage >= 60) {
        let parentUuid = tactor.data.flags.parent;
        if (parentUuid) parentTokenOrActor = await fromUuid(parentUuid);
        let parentActor = parentTokenOrActor.actor ? parentTokenOrActor.actor : parentTokenOrActor;
        let effect = parentActor.effects.find(e => e.data.label === "Guardian of Faith");
        if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: parentActor.uuid, effects: [effect.id] });
    }
}