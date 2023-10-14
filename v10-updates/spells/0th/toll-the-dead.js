try {
    if (args[0].tag !== "OnUse" && args[0].macroPass !== "postDamageRoll" || !args[0].failedSaves.length || !args[0].failedSaves[0]?.actor || args[0].failedSaves[0].actor.system?.attributes?.hp?.value >= args[0].failedSaves[0].actor.system?.attributes?.hp?.max) return;
    let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid); 
    let damageFormula = workflow.damageRoll.formula;
    let newDamageFormula = damageFormula.replace("d8", "d12");
    workflow.damageRoll = await new Roll(newDamageFormula).roll();
    workflow.damageTotal = workflow.damageRoll.total;
    workflow.damageRollHTML = await workflow.damageRoll.render();
} catch (err) {console.error(`Toll the Dead error`, err)}