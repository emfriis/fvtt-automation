// great weapon fighting
// effect on use post damage

const tokenOrActor = await fromUuid(args[0].actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;

if (args[0].tag === "OnUse" && args[0].macroPass === "postDamageRoll") {
  if (!["mwak"].includes(args[0].item.data.actionType) || !args[0].itemData.data.properties?.hvy) return;
  let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid); 
  let damageFormula = workflow.damageRoll.formula;
  let newDamageFormula = damageFormula.replace(/d\d{1,2}/g, (i) => (i + "r<3"));
  workflow.damageRoll = await new Roll(newDamageFormula).roll();
  workflow.damageTotal = workflow.damageRoll.total;
  workflow.damageRollHTML = await workflow.damageRoll.render();
}