// blur

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;

async function blurCheck(workflow) {
	ui.notifications.warn("hi");
	let target = Array.from(workflow.targets)[0];
    if (!target) return;
	let targetId = target.id ?? target._id;
	
	let attacker = workflow.token;
	const senses = workflow.actor.data.data.attributes.senses;
	const aVisRange = attacker.data.flags["perfect-vision"].sightLimit ? attacker.data.flags["perfect-vision"].sightLimit : 9999;
	const aVision = Math.min(aVisRange, Math.max(senses.blindsight, senses.tremorsense, senses.truesight, 0));
	const aDist = MidiQOL.getDistance(attacker, token, false);
	let blurIgnore = aVision >= aDist;
	if (blurIgnore) {
		let canSeeTarget = true;
		if (game.modules.get("conditional-visibility")?.active && game.modules.get("levels")?.active && _levels) { 
			canSeeTarget = game.modules.get('conditional-visibility')?.api?.canSee(attacker, token) && _levels?.advancedLosTestVisibility(attacker, token);
		} 
		blurIgnore = canSeeTarget;
	}

	if (["mwak", "msak", "rwak", "rsak"].includes(workflow.item.data.data.actionType) && lastArg.tokenId == targetId && !blurIgnore) {
		workflow.disadvantage = true;
	}
}

if (args[0] === "on") {
	let hookId = Hooks.on("midi-qol.preAttackRoll", blurCheck);
    DAE.setFlag(tactor, "blurHook", hookId);
}

if (args[0] === "off") {
	const flag = await DAE.getFlag(tactor, "blurHook");
	if (flag) {
		Hooks.off("midi-qol.preAttackRoll", flag);
		await DAE.unsetFlag(tactor, "blurHook");
	}
}