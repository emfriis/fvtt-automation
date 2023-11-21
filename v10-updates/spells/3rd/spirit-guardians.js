try {
    const lastArg = args[args.length - 1];
    if (lastArg.tag == "OnUse" && lastArg.macroPass == "preActiveEffects" && lastArg.actor.system.details.alignment.toLowerCase().includes("evil") && lastArg.item.effects.find(e => e.name == "Spirit Guardians")) {
        let hook1 = Hooks.on("createActiveEffect", async (effect) => {
            if (effect.name == "Spirit Guardians" && effect.parent.uuid == lastArg.actor.uuid) {
                let hook2 = Hooks.on("midi-qol.RollComplete", async (workflowNext) => {
                    if (lastArg.uuid == workflowNext.uuid) {
                        let changes = lastArg.actor.effects.find(e => e.id == effect.id).changes;
                        changes.forEach(c => { c.value = c.value.replace("radiant", "necrotic"); });
                        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: lastArg.actor.uuid, updates: [{ _id: effect.id, changes: changes }] });
                        Hooks.off("midi-qol.RollComplete", hook2);
                    }
                });
                Hooks.off("createActiveEffect", hook1);
            }
        });
    } else if (args[0] == "on" && !isNaN(args[1]) && !isNaN(args[3]) && !lastArg.efData.origin.includes(lastArg.actorUuid) && lastArg.tokenId == game.combat?.current?.tokenId) {
        const tokenOrActor = await fromUuid(lastArg.actorUuid);
        const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
        const source = game.actors.get(lastArg.efData.origin.match(/Actor\.(.*?)\./)[1]) ?? canvas.tokens.placeables.find(t => t.actor && t.actor.id == lastArg.efData.origin.match(/Actor\.(.*?)\./)[1])?.actor;
        const itemData = {
            name: "Spiritual Guardians",
            img: "icons/magic/light/projectile-bolts-salvo-white.webp",
            type: "feat",
            flags: { midiProperties: { magiceffect: true, halfdam: true }, autoanimations: { isEnabled: false } },
            system: {
                activation: { type: "special" },
                target: { type: "creature" },
                actionType: "save",
                damage: { parts: [[`${args[1]}d8`, args[2]]] },
                save: { ability: "wis", dc: args[3], scaling: "flat" }
            }
        }
        const item = new CONFIG.Item.documentClass(itemData, { parent: source ?? actor });
        await MidiQOL.completeItemRoll(item, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [lastArg.tokenUuid] });
    }
} catch (err) {console.error("Spirit Guardians Macro - ", err)}