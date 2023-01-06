// dread ambusher
// damage bonus

if (["mwak","rwak"].includes(args[0].item.data.actionType)) return {damageRoll: `1d8[${args[0].item.data.damage.parts[0][1]}]`, flavor: "Dread Ambusher"};