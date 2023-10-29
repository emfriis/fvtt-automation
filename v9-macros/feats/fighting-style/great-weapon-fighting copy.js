if (args[0].tag === "OnUse" && args[0].macroPass === "postDamageRoll") {
  if (!["mwak"].includes(args[0].item.system.actionType) || !args[0].item.system.properties?.hvy) return;
  let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid); 
  let damageFormula = workflow.damageRoll.formula;
  let newDamageFormula = damageFormula.replace(/d\d{1,2}/, (i) => (i + "r<3"));
  workflow.damageRoll = await new Roll(newDamageFormula).roll();
  workflow.damageTotal = workflow.damageRoll.total;
  workflow.damageRollHTML = await workflow.damageRoll.render();
}