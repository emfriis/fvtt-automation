// blood frenzy
// effect on use pre attack

if (args[0].targets.length < 1 || !["mwak", "rwak", "msak", "rsak"].includes(args[0].itemData.data.actionType) || args[0].macroPass != "preAttackRoll") return;
token = canvas.tokens.get(args[0].tokenId);
actor = token.actor;
if (!actor || !token) return;
let target = canvas.tokens.get(args[0].targets[0].id ?? args[0].targets[0]._id);
if (!target) return;

if (target.actor.data.data.attributes.hp.value < target.actor.data.data.attributes.hp.max) {
	const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    attackWorkflow.advantage = true;
};

// blood frenzy effect flags.midi-qol.advantage.attack.all custom ->

game.user.targets?.first()?.actor?.data?.data?.attributes?.hp?.value < game.user.targets?.first()?.actor?.data?.data?.attributes?.hp?.max