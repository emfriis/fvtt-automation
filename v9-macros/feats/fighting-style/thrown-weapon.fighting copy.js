if (args[0].tag === "DamageBonus") {
	if (!["rwak", "mwak"].includes(args[0].item.system.actionType) || !args[0].item.system.properties?.thr) return {};
	const damageType = args[0].item.data.damage.parts[0][1];
	return {damageRoll: `2[${damageType}]`, flavor: `Thrown Weapon Fighting`};
}