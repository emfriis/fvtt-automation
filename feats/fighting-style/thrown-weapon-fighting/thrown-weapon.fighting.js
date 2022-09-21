if (args[0].tag === "DamageBonus" && args[0].hitTargets.length > 0) {
	if (!["rwak", "mwak"].includes(args[0].item.data.actionType) || !args[0].itemData.data.properties?.thr) return {}; // thrown weapon attack
	const token = canvas.tokens.get(args[0].tokenId);
	const tokenTarget = canvas.tokens.get(args[0].hitTargets[0].id ?? args[0].hitTargets[0]._id);
	if (MidiQOL.getDistance(tokenTarget, token, false) > 5) { // attack is ranged
		const damageType = args[0].item.data.damage.parts[0][1];
		return {damageRoll: `2[${damageType}]`, flavor: "Thrown Weapon Fighting"}
	}
}