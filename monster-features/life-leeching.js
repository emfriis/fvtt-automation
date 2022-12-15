// life leeching
// on use post attack

const tokenOrActor = await fromUuid(args[0].actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse") {
    if (args[0].item.type !== "weapon" ||  args[0].item.data.actionType !== "mwak" || args[0].hitTargets.length === 0 || tactor.effects.find(e => e.data.label === "No Regen")) return;
    const applyDamage = game.macros.find(m => m.name === "ApplyDamage");
    if (applyDamage) await applyDamage.execute("ApplyDamage", args[0].actorUuid, args[0].tokenUuid, "2d6", "healing");
}