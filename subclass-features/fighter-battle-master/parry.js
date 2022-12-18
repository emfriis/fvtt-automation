// parry
// on use macro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse") {
    let attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].workflowOptions.sourceItemUuid);
    if (["mwak","msak"].includes(attackWorkflow.item.data.data.actionType)) return;
    let item = tactor.items.find(i => i.name === "Combat Superiority");
    if (!item || !item.data.data.uses.value || item.data.data.uses.value === item.data.data.uses.max) return;
    item.update({"data.uses.value" : item.data.data.uses.value + 1});
    return ui.notifications.error(`The incoming damage is not from a melee attack`);
}
