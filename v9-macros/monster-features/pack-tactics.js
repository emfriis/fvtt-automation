// pack tactics
// effect on use pre attack

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
		!(t.actor.data.data.details?.type?.value?.length < 3) && // is a creature
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

// pack tactics effect flags.midi-qol.advantage.attack.all custom ->

game.canvas.tokens.placeables.find(t => 
	t.actor &&
	!((t.actor?.system?.details?.type?.value === "custom" || t.actor?.system?.details?.type?.value === "") && t.actor?.system?.details?.type?.custom === "") &&
	t.id !== canvas.tokens.controlled[0].id && 
	t.id !== game.user.targets?.first().id &&
	canvas.tokens.controlled[0].disposition === t.disposition &&
	t.actor?.system?.attributes?.hp?.value > 0 &&
	!(t.actor?.effects?.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.data.label))) &&
	MidiQOL.getDistance(t, game.user.targets?.first(), false) <= 5
)

game.canvas.tokens.placeables.find(t => t.actor && !((t.actor?.system?.details?.type?.value === "custom" || t.actor?.system?.details?.type?.value === "") && t.actor?.system?.details?.type?.custom === "") && t.id !== canvas.tokens.controlled[0].id && t.id !== game.user.targets?.first().id && canvas.tokens.controlled[0].disposition === t.disposition && t.actor?.system?.attributes?.hp?.value > 0 && !(t.actor?.effects?.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.data.label))) && MidiQOL.getDistance(t, game.user.targets?.first(), false) <= 5)