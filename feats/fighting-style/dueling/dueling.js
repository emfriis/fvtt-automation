// dueling

const tokenOrActor = await fromUuid(args[0].actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;

if (args[0].tag === "DamageBonus") {
	if (!["mwak"].includes(args[0].item.data.actionType) || args[0].itemData.data.properties?.two) return {}; // one handed melee weapon attack
	let equippedList = tactor.items.filter((i) => i.data.type === "weapon" && i.data.data.equipped);
	if (equippedList.length > 1) return {};
	const damageType = args[0].item.data.damage.parts[0][1];
	return {damageRoll: `2[${damageType}]`, flavor: "Dueling"}
}