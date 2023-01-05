// eye ray
// on use

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

switch (Math.floor((Math.random() * 4) + 1)) {
    case 1:
        let itemP = tactor.items.find(i => i.name === "Paralyzing Ray");
        await MidiQOL.completeItemRoll(itemP, { targetUuids: args[0].targetUuids });
        break;
    case 2:
        let itemF = tactor.items.find(i => i.name === "Fear Ray");
        await MidiQOL.completeItemRoll(itemF, { targetUuids: args[0].targetUuids });
        break;
    case 3:
        let itemE = tactor.items.find(i => i.name === "Enervation Ray");
        await MidiQOL.completeItemRoll(itemE, { targetUuids: args[0].targetUuids });
        break;
    case 4:
        let itemD = tactor.items.find(i => i.name === "Disintegration Ray");
        await MidiQOL.completeItemRoll(itemD, { targetUuids: args[0].targetUuids });
        break;
    default:
        console.warn(`No Eye Ray Selected`);
}