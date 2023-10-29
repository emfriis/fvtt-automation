// font of inspiration
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "on") {
    let item = tactor.items.find(i => i.data.label === "Bardic Inspiration");
    item.update({ "data.uses.per": "sr" });
}