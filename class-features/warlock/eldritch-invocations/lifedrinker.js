// lifedrinker
// damage bonus

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "DamageBonus" && lastArg.item.name.includes("Pact") && ["mwak","rwak"].includes(lastArg.item.data.actionType)) {
    return { damageRoll: `${tactor.data.data.abilities.cha.mod}[necrotic]`, flavor: "Lifedrinker" }
}