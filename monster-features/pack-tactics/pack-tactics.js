// pack tactics

if (args[0].targets.length < 1 || !["mwak", "rwak", "msak", "rsak"].includes(args[0].itemData.data.actionType) || args[0].macroPass != "preAttackRoll") return;
token = canvas.tokens.get(args[0].tokenId);
actor = token.actor ?? token._actor;
if (!actor || !token) return;
let target = canvas.tokens.get(args[0].targets[0].id ?? args[0].targets[0]._id);
if (!target) return;

let isPack = false;

let nearbyEnemy = canvas.tokens.placeables.filter(t => {
	let nearby = (
		t.actor &&
		t.actor?.uuid !== args[0].actorUuid && // not me
		t.actor?.uuid !== target.actor?.uuid && // not the target
		t.actor?.data.data.attributes?.hp?.value > 0 && // not dead or unconscious
		!(t.actor?.effects.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.data.label))) && // not incapacitated
		t.data.disposition === token.data.disposition && // an ally
		MidiQOL.getDistance(t, target, false) <= 5 // close to the target
	);
	return nearby;
});
isPack = nearbyEnemy.length > 0;

if (isPack) {
	const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    attackWorkflow.advantage = true;
};