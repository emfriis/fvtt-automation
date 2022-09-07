if (args[0].tag === "DamageBonus") {
	if (!["rwak", "mwak"].includes(args[0].item.data.actionType) || !args[0].itemData.data.properties?.thr) return {}; // thrown weapon attack
	const token = canvas.tokens.get(args[0].tokenId);
	const targetToken = canvas.tokens.get(args[0].targets[0].id ?? args[0].targets[0]._id);
	if (canvas.grid.measureDistance(token, targetToken) > 9.5) { // attack is ranged
		const damageType = args[0].item.data.damage.parts[0][1];
		return {damageRoll: `2[${damageType}]`, flavor: "Thrown Weapon Fighting"}
	}
}