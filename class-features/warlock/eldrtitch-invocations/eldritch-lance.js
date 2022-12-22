// eldritch lance
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "on") {
    let blast  = tactor.items.find(i => i.name === "Eldritch Blast" && i.type === "spell");
    if (blast) blast.update({ "data.range.value": 300 });
}