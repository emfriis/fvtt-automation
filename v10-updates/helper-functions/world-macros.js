Hooks.on("midi-qol.preAttackRoll", async (workflow) => {
	try {
		if (["mwak","rwak"].includes(workflow.item.system.actionType) && !workflow.actor.flags["midi-qol"]?.sharpShooter && workflow.item.system.range.long && workflow.item.system.range.value < MidiQOL.computeDistance(workflow.token, [...workflow.targets][0], false)) {
			workflow.disadvantage = true;
			workflow.attackAdvAttribution = workflow.attackAdvAttribution ? new Set([...workflow.attackAdvAttribution].concat(["DIS:longRange"])) : new Set(["DIS:longRange"]);
			workflow.advReminderAttackAdvAttribution = workflow.attackAdvAttribution;
		}
	} catch (err) {console.error("preAttackRoll Hook Macro - ", err)}
});