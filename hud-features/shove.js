// shove

const lastArg = args[args.length - 1];
let tokenOrActor = await fromUuid(lastArg.actorUuid);
let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (!tactor || !lastArg.targetUuids || lastArg.targetUuids.length === 0) return;

const tokenOrActorTarget = await fromUuid(lastArg.targetUuids[0]);
const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;

if (args[0]?.macroPass === "preambleComplete") {

}