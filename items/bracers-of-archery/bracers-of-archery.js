// bracers of archery
// DamageBonus macros

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "DamageBonus") {
	if (!["rwak"].includes(args[0].item.data.actionType)) return {};
    if ((!args[0].item.data.baseItem === "longbow" && !args[0].item.data.baseItem === "shortbow") || (!args[0].item.name.includes("longbow") && !args[0].item.name.includes("shortbow"))) return {};
	const damageType = args[0].item.data.damage.parts[0][1];
	return {damageRoll: `2[${damageType}]`, flavor: "Bracers of Archery"}
}