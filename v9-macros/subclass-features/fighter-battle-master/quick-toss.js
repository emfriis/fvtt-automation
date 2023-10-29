if (args[0].tag === "DamageBonus" && args[0].hitTargets.length > 0) {
	if (!["rwak", "mwak"].includes(args[0].item.data.actionType) || !args[0].itemData.data.properties?.thr) return {}; // thrown weapon attack
	const tokenOrActor = await fromUuid(args[0].tokenUuid);
	const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
	const die = tactor.data.data.scale["battle-master"]["combat-superiority-die"];
	const token = canvas.tokens.get(args[0].tokenId);
	const tokenTarget = canvas.tokens.get(args[0].hitTargets[0].id ?? args[0].hitTargets[0]._id);
	if (MidiQOL.getDistance(tokenTarget, token, false) > 5) { // attack is ranged
		const diceMult = args[0].isCritical ? 2: 1;
		const damageType = args[0].item.data.damage.parts[0][1];
		return {damageRoll: `${diceMult}${die}[${damageType}]`, flavor: "Quick Toss"}
	}
}