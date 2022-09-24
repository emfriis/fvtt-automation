const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

if (args[0] === "on" && !tactor.data.data.traits.ci.value.includes("blinded")) {
    const token = await fromUuid(lastArg.tokenUuid);
    const senses = tactor.data.data.attributes.senses;
    let visionRange = Math.max(senses.blindsight, senses.tremorsense, 0);
    token.setFlag('perfect-vision', 'sightLimit', visionRange);
}

if (args[0] === "off" && !tactor.effects.find(i => i.data.label === "Blinded")) {
    const token = await fromUuid(lastArg.tokenUuid);
    token.setFlag('perfect-vision', 'sightLimit', null);
}