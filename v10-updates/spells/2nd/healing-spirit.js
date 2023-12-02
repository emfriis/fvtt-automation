try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects" && args[0].item.type == "spell") {
        const summonId = args[0].item._id + '-' + args[0].itemCardId;
        let hook = Hooks.on("summonComplete", async (summonIdNext, summons) => {
            if (summonId != summonIdNext) return;
            summons.tokenIds.forEach(async (t) => { 
                let token = canvas.tokens.get(t);
                let actor = token?.actor;
                if (!token || !actor) return;
                itemData = {
                    name: "Healing Sprit",
                    img: "",
                    type: "feat",
                    system: {
                        weaponType: "natural",
                        description: { value: `Until the spell ends, whenever you or a creature you can see moves into the spirit's space for the first time on a turn or starts its turn there, you can cause the spirit to restore ${args[0].spellLevel - 1}d6 hit points to that creature (no action required). The spirit can't heal constructs or undead. The spirit can heal a number of times equal to 1 + your spellcasting ability modifier (minimum of twice). After healing that number of times, the spirit disappears.` },
                        activation: { type: "special" },
                        target: { value: 1, type: "creature" },
                        range: { value: 0, units: "ft" },
                        actionType: "healing",
                        damage: { parts: [[`${args[0].spellLevel - 1}d6`, healing]] }
                    },
                    flags: { midiProperties: { magiceffect: true },"midi-qol": { onUseMacroName: "[postActiveEffects]", onUseMacroParts: { items: [{ macroName: "", option: "postActiveEffects" }] } } }
                }
                await actor.createEmbeddedDocuments("Item", [itemData]);
            });
            Hooks.off("summonComplete", hook);
        });
    } else if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects" && args[0].item.type == "feat") {
        await args[0].actor.update({ "system.attributes.hp.value": args[0].actor.system.attributes.hp.value - 1 });
        if (args[0].actor.system.attributes.hp.value < 1) {
            const parentTokenOrActor = await fromUuid(args[0].workflow.token.document.flags?.["midi-qol"]?.parentUuid);
            const parent = parentTokenOrActor.actor ? parentTokenOrActor.actor : parentTokenOrActor;
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: parent.uuid, effects: [parent.effects.find(e => e.flags?.["midi-qol"]?.summonId == args[0].workflow.token.document.flags?.["midi-qol"]?.summonId).id] });
        }
    }
} catch (err) {console.error("Healing Spirit Macro - ", err)}