// mantle of inspiration
// on use

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const bardicInspiration = tactor.items.find(i => i.data.label === "Bardic Inspiration");
if (bardicInspiration.data.uses.value < 1) return;

for (let i = 0; i < lastArg.targets.length; i++) {
    let tactorTarget = lastArg.targets[i].actor ?? lastArg.targets[i];
    if (tactor.data.data.details?.level > tactorTarget.data.data.attributes.hp.temp) {
        tactorTarget.update({"data.attributes.hp.temp": tactor.data.data.details?.level});
    };
};

bardicInspiration.update({"data.uses.value": bardicInspiration.data.uses.value - 1});