try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects" && args[0].item.type == "spell") {
        const summonId = args[0].item._id + '-' + args[0].itemCardId;
        let hook = Hooks.on("updateActor", async () => {
            const summons = game.canvas.tokens.placeables.filter(t => t.document.flags?.["midi-qol"]?.summonId == summonId);
            if (summons.length) {
                summons.forEach(async s => { 
                    actor = s.actor;
                    itemData = {
                        name: "Guardian of Faith",
                        img: "icons/magic/control/buff-flight-wings-runes-blue-white.webp",
                        type: "weapon",
                        system: {
                            weaponType: "natural",
                            description: { value: "Any creature hostile to you that moves to a space within 10 feet of the guardian for the first time on a turn must succeed on a Dexterity saving throw. The creature takes 20 radiant damage on a failed save, or half as much damage on a successful one. The guardian vanishes when it has dealt a total of 60 damage." },
                            activation: { type: "special" },
                            target: { value: 1, type: "creature" },
                            range: { value: 10, units: "ft" },
                            properties: { mgc: true, rch: true },
                            actionType: "save",
                            save: { ability: "dex", dc: args[0].actor.system.attributes.spelldc, scaling: "flat" },
                            damage: { parts: [["20", "radiant"]] }
                        },
                        flags: { midiProperties: { magiceffect: true },"midi-qol": { onUseMacroName: "[postActiveEffects]GuardianOfFaith", onUseMacroParts: { items: [{ macroName: "GuardianOfFaith", option: "postActiveEffects" }] } } }
                    }
                    await actor.createEmbeddedDocuments("Item", [itemData]);
                });
                Hooks.off("updateActor", hook);
            }
        });
    } else if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects" && args[0].item.type == "weapon") {
        const appliedDamage = args[0]?.damageList[0]?.appliedDamage;
        await args[0].actor.update({ "system.attributes.hp.value": args[0].actor.system.attributes.hp.value - appliedDamage });
        if (args[0].actor.system.attributes.hp.value < 1) {
            const parentTokenOrActor = await fromUuid(args[0].workflow.token.document.flags?.["midi-qol"]?.parentUuid);
            const parent = parentTokenOrActor.actor ? parentTokenOrActor.actor : parentTokenOrActor;
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: parent.uuid, effects: [parent.effects.find(e => e.flags?.["midi-qol"]?.summonId == args[0].workflow.token.document.flags?.["midi-qol"]?.summonId).id] });
        }
    }
} catch (err) {console.error("Guardian of Faith Macro - ", err)}