// parry
// on use macro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse") {
    let attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].workflowOptions.sourceItemUuid);
    if (["mwak","msak"].includes(attackWorkflow.item.data.data.actionType)) return;
    let superiority = Object.keys(tactor.data.data.resources).find(r => tactor.data.data.resources[`${r}`].label === "Combat Superiority");
    if (!superiority) return;
    if (tactor.data.data.resources[superiority].value >= tactor.data.data.resources[superiority].max) return;
    let actorData = duplicate(tactor.data._source);
    actorData.data.resources[superiority].value = actorData.data.resources[superiority].value + 1;
    await tactor.update(actorData);
    return ui.notifications.error(`The incoming damage is not from a melee attack`);
}
