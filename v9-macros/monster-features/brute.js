// brute
// damage bonus

if (args[0].tag === "DamageBonus" && ["mwak"].includes(args[0].itemData.data.actionType)) {
    const diceMult = args[0].isCritical ? 2: 1;
    const baseDice = 1;
    const diceFace = args[0]?.damageRoll?.dice[0]?.faces;
    const damageType = args[0].item.data.damage.parts[0][1];
    return {damageRoll: `${baseDice * diceMult}d${diceFace}[${damageType}]`, flavor: "Brute"};
}

try {
  if (!["mwak"].includes(args[0].itemData.data.actionType)) return; // abort if not weapon attack
  const diceMult = args[0].isCritical ? 2 : 1;
  return {damageRoll: `${diceMult}d${args[0].damageRoll.dice[0].faces}`, flavor: "Brute"};
} catch (err) {
  console.error(`Brute error`, err);
}