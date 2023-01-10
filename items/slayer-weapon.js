// slayer weapon
// damage bonus
// requires creature type to be appended to start of item name

if (args[0].tag === "DamageBonus" && args[0].item.type === "weapon" && args[0].item.name.includes(" Slayer ") && args[0].targets.find(t => t.actor && (args[0].item.name.toLowerCase().includes(t.actor.data.data.details?.type?.value?.toLowerCase()) || args[0].item.name.toLowerCase().includes(t.actor.data.data.details?.race?.toLowerCase())))) {
    return { damageRoll: `3d6[${args[0].item.data.damage.parts[0][1]}]`, flavor: "Slayer Weapon" }
}