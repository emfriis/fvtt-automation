// toll the dead
// on use post damage

const tokenOrActor = await fromUuid(args[0].actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;

if (args[0].tag === "OnUse" && args[0].macroPass === "postDamageRoll" && args[0].failedSaves.length > 0) {
    let target = await fromUuid(args[0].failedSaveUuids[0]);
    let targetActor = target.actor ? target.actor : target;
    if (targetActor.data.data.attributes.hp.value < targetActor.data.data.attributes.hp.max) {
    let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid); 
    let damageFormula = workflow.damageRoll.formula;
    let newDamageFormula = damageFormula.replace("d8", "d12");
    workflow.damageRoll = await new Roll(newDamageFormula).roll();
    workflow.damageTotal = workflow.damageRoll.total;
    workflow.damageRollHTML = await workflow.damageRoll.render();
    }
}