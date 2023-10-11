//dueling

try {
	if (args[0].tag !== "DamageBonus" || !args[0].damageRoll.total || !["mwak"].includes(args[0].item.system.actionType) || args[0].item.system.properties?.two) return; 
	let equippedList = args[0].actor.items.filter((i) => i.system.type === "weapon" && i.system.equipped);
	if (equippedList.length > 1) return;
	return {damageRoll: `2`, flavor: `Dueling`}
} catch (err)  {console.error("Fighting Style: Dueling Macro - ", err)}

//great weapon fighting

try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postDamageRoll" || !args[0].damageRoll.total || !["mwak"].includes(args[0].item.system.actionType) || !args[0].item.system.properties?.hvy) return;
    let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid); 
    let damageFormula = workflow.damageRoll.formula;
    let newDamageFormula = damageFormula.replace(/d\d{1,2}/, (i) => (i + "r<3"));
    workflow.damageRoll = await new Roll(newDamageFormula).roll();
    workflow.damageTotal = workflow.damageRoll.total;
    workflow.damageRollHTML = await workflow.damageRoll.render();
} catch (err)  {console.error("Fighting Style: Great Weapon Fighting Macro - ", err)}

// thrown weapon fighting

try {
	if (args[0].tag !== "DamageBonus" || !args[0].damageRoll.total || !["rwak", "mwak"].includes(args[0].item.system.actionType) || !args[0].item.system.properties?.thr) return;
	return {damageRoll: `2`, flavor: `Thrown Weapon Fighting`};
} catch (err)  {console.error("Fighting Style: Thrown Weapon Fighting Macro - ", err)}
