// eldritch smite
// damage bonus

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "DamageBonus" && lastArg.item.name.includes("Pact") && ["mwak","rwak"].includes(lastArg.item.data.actionType)) {
    try {

    } catch (err) {
        console.error ("Eldritch Smite macro error", err);
    }
}