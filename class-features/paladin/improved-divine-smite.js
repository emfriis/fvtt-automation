// improved divine smite

if (args[0].tag === "DamageBonus" && ["mwak"].includes(args[0].item.data.actionType)) {
	const diceMult = args[0].isCritical ? 2 : 1;
	return { damageRoll: `${diceMult}d8[radiant]`, flavor: "Improved Divine Smite" };
}