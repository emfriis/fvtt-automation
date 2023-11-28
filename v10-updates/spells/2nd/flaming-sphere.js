try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects") return;
    const summonId = args[0].item._id + '-' + args[0].itemCardId;
    const damageType = args[0].workflow.defaultDamageType ? args[0].workflow.defaultDamageType.toLowerCase() : "fire";
    let hook = Hooks.on("summonComplete", async (summonIdNext, summons) => {
        if (summonId != summonIdNext) return;
        summons.tokenIds.forEach(async (t) => { 
            let token = canvas.tokens.get(t);
            let actor = token?.actor;
            if (!token || !actor) return;
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
                    damage: { parts: [[`${args[0].spellLevel}d6`, damageType]] }
                }
            }
            await actor.createEmbeddedDocuments("Item", [itemData]);
            const effectData = { 
                changes: [{ key: "flags.midi-qol.OverTime", mode: 0, value: `turn=end,label=Flaming Sphere,saveAbility=dex,saveDC=${args[0].actor.system.attributes.spelldc},damageRoll=${args[0].spellLevel}d6,damageType=${damageType},saveMagic=true,saveDamage=halfdamage,saveRemove=false,killAnim=true`, priority: 20 }], 
                disabled: false, 
                icon: "icons/magic/fire/orb-vortex.webp", 
                name: "Flaming Sphere Damage",
                flags: { ActiveAuras: { aura: "All", displayTemp: true, height: true, hidden: true, hostile: false, ignoreSelf: true, isAura: true, onlyOnce: false, radius: 5, wallsBlock: "true", customCheck: "MidiQOL.typeOrRace(actor.uuid)" }, dae: { stackable: "noneName" } }
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [effectData] });
        });
        Hooks.off("summonComplete", hook);
    });
} catch (err) {console.error("Flaming Sphere Macro - ", err)}