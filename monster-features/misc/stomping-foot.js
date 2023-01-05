// stomping foot
// damage bonus

if (args[0].tag === "DamageBonus" && args[0].item.name === "Stomping Foot" && args[0]?.targets[0]?.actor?.effects?.find(e => e.data.label === "Prone")) return { damageRoll: `2d10[bludgeoning]`, flavor: `Stomping Foot` }