try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects") return;
    const summonId = args[0].item._id + '-' + args[0].itemCardId
    let hook = Hooks.on("updateActor", async () => {
        const summons = game.canvas.tokens.placeables.filter(t => t.document.flags?.["midi-qol"]?.summonId == summonId);
        if (summons.length) {
            summons.forEach(async s => { 
                actor = s.actor;
                itemData = {
                    name: "Flaming Sphere",
                    img: "icons/magic/fire/orb-vortex.webp",
                    type: "weapon",
                    flags: { midiProperties: { magiceffect: true, halfdam: true } },
                    system: {
                        weaponType: "natural",
                        properties: { mgc: true },
                        description: { value: "As a Bonus Action, you can move the Sphere up to 30 feet. If you ram the sphere into a creature, that creature must make the saving throw against the sphere's damage, and the sphere stops moving this turn." },
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 1, type: "creature" },
                        range: { value: 5, units: "ft" },
                        actionType: "save",
                        save: { ability: "dex", dc: args[0].actor.system.attributes.spelldc, scaling: "flat" },
                        damage: { parts: [[`${args[0].spellLevel}d6`, "fire"]] }
                    }
                }
                await actor.createEmbeddedDocuments("Item", [itemData]);
                const effectData = { 
                    changes: [{ key: "flags.midi-qol.OverTime", mode: 0, value: `turn=end,label=Flaming Sphere,saveAbility=dex,saveDC=${args[0].actor.system.attributes.spelldc},damageRoll=${args[0].spellLevel}d6,damageType=fire,saveMagic=true,saveDamage=halfdamage,saveRemove=false,killAnim=true`, priority: 20 }], 
                    disabled: false, 
                    icon: "icons/magic/fire/orb-vortex.webp", 
                    name: "Flaming Sphere Damage",
                    flags: { ActiveAuras: { aura: "All", displayTemp: true, height: true, hidden: true, hostile: false, ignoreSelf: true, isAura: true, onlyOnce: false, radius: 5, wallsBlock: "true" }, dae: { stackable: "noneName" } }
                };
                await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [effectData] });
            });
            Hooks.off("updateActor", hook);
        }
    });
} catch (err) {console.error("Flaming Sphere Macro - ", err)}