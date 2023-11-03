try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects") return;
    let hook = Hooks.on("fs-postSummon", async () => {
        const summons = game.canvas.tokens.placeables.filter(t => t.document.flags?.["midi-qol"]?.summonId == args[0].item.id + '-' + args[0].itemCardId);
        if (summons.length) {
            summons.forEach(async s => { 
                actor = s.actor;
                itemData = {
                    name: "Spiritual Weapon",
                    img: "icons/weapons/swords/sword-winged-pink.webp",
                    type: "weapon",
                    system: {
                        weaponType: "natural",
                        description: { value: "You can make a melee spell attack against a creature within 5 feet of the weapon. On a hit, the target takes force damage equal to 1d8 + your spellcasting ability modifier." },
                        attackBonus: `${args[0].actor.system.abilities[args[0].actor.spellcasting ? args[0].actor.spellcasting : "wis"].mod} + ${args[0].actor.system.attributes.prof} - @attributes.prof`,
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 1, type: "creature" },
                        range: { value: 5, units: "ft" },
                        actionType: "msak",
                        damage: { parts: [[`${Math.max(Math.floor(args[0].spellLevel / 2), 1)}d8 + ${args[0].actor.system.abilities[args[0].actor.spellcasting ? args[0].actor.spellcasting : "wis"].mod}`, "force"]] }
                    }
                }
                await actor.createEmbeddedDocuments("Item", [itemData]);
            });
            Hooks.off("fs.postSummon", hook);
        }
    });
} catch (err) {console.error("Spiritual Weapon Macro - ", err)}