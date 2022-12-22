// lance of lethargy
// effect on use post attack roll

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && args[0].macroPass === "postAttackRoll" && args[0].item.name == "Eldritch Blast") {
    
}