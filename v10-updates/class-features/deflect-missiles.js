try {
    if (args[0].macroPass != "postActiveEffects") return;
	const effectData = {
		changes: [{ key: "flags.midi-qol.DR.all", mode: 0, value: `${args[0].damageRoll.total}`, priority: 20 }],
		disabled: false,
		duration: { seconds: 1, turns: 1 },
		flags: { dae: { specialDuration: ["combatEnd", "1Reaction", "isDamaged"] } },
		name: args[0].item.name,
		icon: args[0].item.img
	};
	await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
	const usesItem = args[0].actor.items.find(i => i.name == "Ki" && i.system.uses.value);
	const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].workflowOptions.sourceItemUuid);
	if (!usesItem || args[0].damageRoll.total < args[0].workflowOptions.damageTotal || MidiQOL.computeDistance(args[0].workflow.token, attackWorkflow.token, false) > 60) return;
	let attackDialog = await new Promise((resolve) => {
		new Dialog({
			title: "Ki: Deflect Missiles",
			content: `<div><p>Spend 1 Ki Point to throw the projectile back?</p><p>(${usesItem.system.uses.value} Ki Point${usesItem.system.uses.value > 1 ? "s" : ""} Remaining)</p></div>`,
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
	let useAttack = await attackDialog;
	if (!useAttack) return;
	const attackItem = await fromUuid(args[0].workflowOptions.sourceItemUuid);
	const attackItemData = attackItem.toObject();
	attackItemData.system.range.value = 20;
	attackItemData.system.range.long = 60;
	attackItemData.system.consume = {};
	attackItemData.system.proficient = 1;
    const returnItem = new CONFIG.Item.documentClass(attackItemData, { parent: args[0].actor });
	returnItem._prepareProficiency();
    await MidiQOL.completeItemUse(returnItem, {}, { showFullCard: false, createWorkflow: true, configureDialog: false, targetUuids: [attackWorkflow.tokenUuid], autoConsumeResource: "none" });
	await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
} catch (err) {console.error("Deflect Missiles Macro - ", err)}