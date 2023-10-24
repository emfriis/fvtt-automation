//dueling

try {
	if (args[0].tag !== "DamageBonus" || !args[0].damageRoll || args[0].item.system.actionType !== "mwak" || args[0].item.system.properties?.two) return; 
	let equippedList = args[0].actor.items.filter((i) => i.system.type === "weapon" && i.system.equipped);
	if (equippedList.length > 1) return;
	return {damageRoll: `2`, flavor: `Dueling`}
} catch (err)  {console.error("Fighting Style: Dueling Macro - ", err)}

//great weapon fighting

try {
    if (args[0].tag !== "DamageBonus" || !args[0].damageRoll || args[0].item.system.actionType !== "mwak" || !args[0].item.system.properties?.hvy) return;
    Hooks.once("midi-qol.DamageRollComplete", async workflowNext => {
        const newDamageRoll = await new Roll(workflow.damageRoll._formula.replace(/d\d{1,2}/g, (i) => (i + "r<3"))).evaluate({async: true});
        await workflowNext.setDamageRoll(newDamageRoll);
    });
} catch (err)  {console.error("Fighting Style: Great Weapon Fighting Macro - ", err)}

// thrown weapon fighting

try {
	if (args[0].tag !== "DamageBonus" || !args[0].damageRoll || !["rwak", "mwak"].includes(args[0].item.system.actionType) || !args[0].item.system.properties?.thr) return;
	return {damageRoll: `2`, flavor: `Thrown Weapon Fighting`};
} catch (err)  {console.error("Fighting Style: Thrown Weapon Fighting Macro - ", err)}
