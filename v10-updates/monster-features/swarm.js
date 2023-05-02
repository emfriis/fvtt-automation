try {
    const attacker = canvas.tokens.get(args[0].tokenId); 
    if (!attacker.actor || !["mwak","rwak"].includes(args[0].item.system.actionType) || attacker.actor.system.attributes.hp.value <= attacker.actor.system.attributes.hp.max / 2) return; // abort if not weapon attack or below half hit points
    const diceMult = args[0].isCritical ? 2 : 1;
    return {damageRoll: `${diceMult}d${args[0].damageRoll.dice[0].faces}`, flavor: "Swarm"};
} catch (err) {
    console.error(`Swarm error`, err);
}