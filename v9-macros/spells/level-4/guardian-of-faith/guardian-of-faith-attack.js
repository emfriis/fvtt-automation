// guardian of faith attack
// on use post effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
    let guardianDamage = tactor.getFlag("midi-qol", "guardianDamage");
    await tactor?.setFlag("midi-qol", "guardianDamage", (guardianDamage ?? 0) + args[0]?.damageList[0]?.appliedDamage);
    if ((guardianDamage ?? 0) + args[0]?.damageList[0]?.appliedDamage >= 60) {
        let parentId = tactor.data.flags.parent;
        if (parentId) parentToken = canvas.tokens.get(parentId);
        if (parentToken) parentActor = parentToken.actor;
        if (parentActor) effect = parentActor.effects.find(e => e.data.label === "Guardian of Faith");
        if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: parentActor.uuid, effects: [effect.id] });
    }
}