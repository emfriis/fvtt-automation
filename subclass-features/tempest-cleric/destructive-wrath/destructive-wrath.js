// destructive wrath

const tokenOrActor = await fromUuid(args[0].actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;

if (args[0].tag === "OnUse" && args[0].hitTargets.length > 0) {
    const resourceList = [{ name: "primary" }, { name: "secondary" }, { name: "tertiary" }];
    const resourceValues = Object.values(tactor.data.data.resources);
    const resourceTable = mergeObject(resourceList, resourceValues);
    const abilityName = "Channel Divinity";
    const findResourceSlot = resourceTable.find(i => i.label.toLowerCase() === abilityName.toLowerCase());
    if (!findResourceSlot) return ui.notifications.error(`<strong>REQUIRED</strong>: Please add "<strong>${abilityName}</strong>" as one of your <strong>Resources</strong>.`);
    if (findResourceSlot.value < 1) return;
    const resourceSlot = findResourceSlot.name;
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

    let actor_data = duplicate(tactor.data._source);
    actor_data.data.resources[resourceSlot].value = Math.max(0, actor_data.data.resources[resourceSlot].value - 1);
    await tactor.update(actor_data);
}