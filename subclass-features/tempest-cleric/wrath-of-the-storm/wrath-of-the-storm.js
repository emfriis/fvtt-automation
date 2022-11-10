// wrath of the storm

const tokenOrActor = await fromUuid(args[0].actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;
const token = canvas.tokens.get(args[0].tokenId);

if (args[0].tag === "OnUse") {
    let workflow = MidiQOL.Workflow.getWorkflow(args[0].workflowOptions.sourceItemUuid); 
    if (!["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType) || MidiQOL.getDistance(workflow.token, token, false) > 5) return;
    let type = await new Promise((resolve, reject) => {
        new Dialog({
            title: "Wrath of the Storm",
            content: "Choose a damage type",
            buttons: {
                Lightning: {
                    label: "Lightning",
                    callback: async () => {resolve("lightning")},
                },
                Thunder: {
                    label: "Thunder",
                    callback: async () => {resolve("thunder")},
                },
            },
            default: "Lightning",
            close: () => {resolve(false)}
        }).render(true);
    });
    if (!type) return;
    let itemWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid); 
    itemWorkflow.defaultDamageType = type;
}