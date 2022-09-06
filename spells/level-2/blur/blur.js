// blur

const lastArg = args[args.length - 1];
const token = await fromUuid(lastArg.tokenUuid);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;

async function blurCheck(workflow) {
	let target = Array.from(workflow.targets)[0];
    if (!target) return;
	let targetId = target.id ?? target._id;
	
	let attacker = canvas.tokens.get(workflow.tokenId);
	const senses = workflow.actor.data.data.attributes.senses;
	const aVisRange = token.getFlag('perfect-vision', 'sightLimit') ? token.getFlag('perfect-vision', 'sightLimit') : 9999;
	const aVision = Math.min(aVisRange, Math.max(senses.blindsight, senses.tremorsense, senses.truesight, 0));
	const aDist = MidiQOL.getDistance(token, attacker, false);
	let blurIgnore = aVision >= aDist;
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