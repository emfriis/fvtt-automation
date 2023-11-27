try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects") return;
    const summonId = args[0].item._id + '-' + args[0].itemCardId;
    const damageType = args[0].workflow.defaultDamageType ? args[0].workflow.defaultDamageType.toLowerCase() : "force";
    let hook = Hooks.on("summonComplete", async (summonIdNext, summons) => {
        if (summonId != summonIdNext) return;
        summons.tokenIds.forEach(async (t) => { 
            let token = canvas.tokens.get(t);
            let actor = token?.actor;
            if (!token || !actor) return;
            itemData = {
                name: "Spiritual Weapon",
                img: "icons/weapons/swords/sword-winged-pink.webp",
                type: "weapon",
                flags: { midiProperties: { magiceffect: true } },
                system: {
                    weaponType: "natural",
                    properties: { mgc: true },
                    description: { value: `You can make a melee spell attack against a creature within 5 feet of the weapon. On a hit, the target takes ${damageType} damage equal to 1d8 + your spellcasting ability modifier.` },
                    attackBonus: `${args[0].actor.system.abilities[args[0].actor.spellcasting ? args[0].actor.spellcasting : "wis"].mod} + ${args[0].actor.system.attributes.prof} - @attributes.prof`,
                    activation: { type: "bonus", cost: 1 },
                    target: { value: 1, type: "creature" },
                    range: { value: 5, units: "ft" },
                    actionType: "msak",
                    damage: { parts: [[`${Math.max(Math.floor(args[0].spellLevel / 2), 1)}d8 + ${args[0].actor.system.abilities[args[0].actor.spellcasting ? args[0].actor.spellcasting : "wis"].mod}`, damageType]] }
                }
            }
            await actor.createEmbeddedDocuments("Item", [itemData]);
        });
        Hooks.off("summonComplete", hook);
    });
} catch (err) {console.error("Spiritual Weapon Macro - ", err)}