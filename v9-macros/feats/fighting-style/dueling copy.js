if (args[0].tag === "DamageBonus") {
	if (!["mwak"].includes(args[0].item.system.actionType) || args[0].item.system.properties?.two) return {}; 
	let equippedList = args[0].actor.items.filter((i) => i.system.type === "weapon" && i.system.equipped);
	if (equippedList.length > 1) return {};
	const damageType = args[0].item.data.damage.parts[0][1];
	return {damageRoll: `2[${damageType}]`, flavor: `Dueling`}
}