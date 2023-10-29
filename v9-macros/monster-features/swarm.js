// swarm
// damage bonus

if (args[0].actorData.data.attributes.hp.value > args[0].actorData.data.attributes.hp.max / 2) return { damageRoll: `${args[0].item.data.damage.parts[1][1]}[${args[0].item.data.damage.parts[0][1]}]`, flavor: "Swarm" }

try {
  const attacker = canvas.tokens.get(args[0].tokenId); 
  if (!attacker.actor || !["mwak","rwak"].includes(args[0].itemData.data.actionType) || attacker.actor.data.data.attributes.hp.value <= attacker.actor.data.data.attributes.hp.max / 2) return; // abort if not weapon attack or below half hit points
  const diceMult = args[0].isCritical ? 2 : 1;
  return {damageRoll: `${diceMult}d${args[0].damageRoll.dice[0].faces}`, flavor: "Swarm"};
} catch (err) {
  console.error(`Swarm error`, err);
}