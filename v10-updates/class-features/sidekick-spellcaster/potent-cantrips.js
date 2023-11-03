try {
    if (args[0].tag == "DamageBonus" && args[0].damageRoll.total && args[0].item.type == "spell" && args[0].item.system.level == 0) return {damageRoll:`${args[0].actor.system.abilities[args[0].actor.system.attributes.spellcasting].mod}`,flavor:`Potent Cantrips`}
} catch (err) {console.error("Potent Cantrip Macro - ", err)}

try {
    if (args[0].tag == "DamageBonus" && args[0].damageRoll.total && args[0].item.type == "spell" && args[0].item.system.level > 0 && ["prepared", "always", "pact"].includes(args[0].item.system.preparation.mode) && args[0].item.system.damage.parts.find(p => !["temphp", "midinone", ""].includes(p[1].toLowerCase() && p[0].toLowerCase().includes("d"))) && args[0].actor.items.find(i => i.name.toLowerCase().includes(`chosen school: ${args[0].item.system.school.slice(0, 2)}`))) return {damageRoll:`${args[0].actor.system.abilities[args[0].actor.system.attributes.spellcasting].mod}`,flavor:`Empowered Spells`}
} catch (err) {console.error("Empowered Spells Macro - ", err)}