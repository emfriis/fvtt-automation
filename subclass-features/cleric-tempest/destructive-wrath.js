// destructive wrath
// effect on use before damage

const tokenOrActor = await fromUuid(args[0].actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;

if (args[0].tag === "OnUse" && args[0].hitTargets.length > 0) {
    let item = tactor.items.find(i => i.name.toLowerCase().includes("channel divinity"));
    if (!item || !item.data.data.uses.value) return;
    const workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    if (!(["lightning", "thunder"].some(type => type === workflow.item.data.data.damage.parts[0][1].toLowerCase()))) return;
    let useFeat = await new Promise((resolve, reject) => {
        new Dialog({
            title: "Channel Divinity: Destructive Wrath",
            content: "Use Feature?",
            buttons: {
                Confirm: {
                    label: "Confirm",
                    callback: async () => {resolve(true)},
                },
                Cancel: {
                    label: "Cancel",
                    callback: async () => {resolve(false)},
                },
            },
            default: "Cancel",
            close: () => {resolve(false)}
        }).render(true);
    });
    if (!useFeat) return;

    let damageFormula = workflow.damageRoll.formula;
    let newDamageFormula = damageFormula.replace(/\d+d\d+/g, (i) => {
        let die = parseInt(i.match(/^(\d+)/));
        let faces = parseInt(i.match(/(\d+)+$/));
        return `${die * faces}`;
    });
    workflow.damageRoll = await new Roll(newDamageFormula).roll();
    workflow.damageTotal = workflow.damageRoll.total;
    workflow.damageRollHTML = await workflow.damageRoll.render();

    item.update({"data.uses.value" : item.data.data.uses.value - 1});
}