// wrath of the storm WIP

const token = canvas.tokens.get(args[0].tokenId);
const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].workflowOptions.sourceItemUuid);
console.warn(args[0].workflowOptions.sourceItemUuid);
console.warn("WORKFLOW");
console.warn(attackWorkflow);
if (!["mwak","rwak","msak","rsak"].includes(attackWorkflow?.item.data.data.actionType) || MidiQOL.getDistance(workflow.token, token, false) > 5) return;
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
if (!type) type === "lightning";
const itemWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid); 
itemWorkflow.defaultDamageType = type;