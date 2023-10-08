//dueling

try {
	if (args[0].tag !== "DamageBonus" || !["mwak"].includes(args[0].item.system.actionType) || args[0].item.system.properties?.two || !args[0].damageRoll.total) return; 
	let equippedList = args[0].actor.items.filter((i) => i.system.type === "weapon" && i.system.equipped);
	if (equippedList.length > 1) return;
	return {damageRoll: `2`, flavor: `Dueling`}
} catch (err)  {console.error("Fighting Style: Dueling Macro - ", err); }

//great weapon fighting

try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postDamageRoll" || !["mwak"].includes(args[0].item.system.actionType) || !args[0].item.system.properties?.hvy) return;
    let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid); 
    let damageFormula = workflow.damageRoll.formula;
    let newDamageFormula = damageFormula.replace(/d\d{1,2}/, (i) => (i + "r<3"));
    workflow.damageRoll = await new Roll(newDamageFormula).roll();
    workflow.damageTotal = workflow.damageRoll.total;
    workflow.damageRollHTML = await workflow.damageRoll.render();
} catch (err)  {console.error("Fighting Style: Great Weapon Fighting Macro - ", err); }

// thrown weapon fighting

try {
	if (args[0].tag !== "DamageBonus" || !["rwak", "mwak"].includes(args[0].item.system.actionType) || !args[0].item.system.properties?.thr || !args[0].damageRoll.total) return;
	return {damageRoll: `2`, flavor: `Thrown Weapon Fighting`};
} catch (err)  {console.error("Fighting Style: Thrown Weapon Fighting Macro - ", err); }
