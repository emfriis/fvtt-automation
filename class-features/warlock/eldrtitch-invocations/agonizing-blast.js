// agonizing blast
// damage bonus

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "DamageBonus" && args[0].item.name == "Eldritch Blast") {
    return { damageRoll: `${tactor.data.data.abilities.cha.mod}[force]`, flavor: "Agonizing Blast" }
}