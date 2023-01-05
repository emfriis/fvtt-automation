// swarm
// damage bonus

if (args[0].actor.data.attributes.hp.value > args[0].actor.data.attributes.hp.max / 2) return { damageRoll: `1d4[${args[0].item.data.damage.parts[0][1]}]`, flavor: "Swarm" }