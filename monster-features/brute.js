// brute
// damage bonus

if (args[0].tag === "DamageBonus" && args[0]?.hitTargets.length > 0 && ["mwak"].includes(args[0].itemData.data.actionType)) {
    const diceMult = args[0].isCritical ? 2: 1;
    const baseDice = 1;
    const diceFace = args[0]?.damageRoll?.dice[0]?.faces;
    const damageType = args[0].item.data.damage.parts[0][1];
    return {damageRoll: `${baseDice * diceMult}d${diceFace}[${damageType}]`, flavor: "Brute"};
}