try {
    if (args[0].macroPass != "preActiveEffects" || !args[0].item.effects.find(e => e.name == "Spirit Guardians")) return;
    const damageType = args[0].workflow.newDefaultDamageType ? args[0].workflow.newDefaultDamageType : args[0].workflow.defaultDamageType.toLowerCase() != "radiant" ? args[0].workflow.defaultDamageType : args[0].actor.system.details.alignment.toLowerCase().includes("evil") ? "necrotic" : "radiant";
    let hook1 = Hooks.on("createActiveEffect", async (effect) => {
        if (effect.name == "Spirit Guardians" && effect.parent.uuid == args[0].actor.uuid) {
            let hook2 = Hooks.on("midi-qol.RollComplete", async (workflowNext) => {
                if (args[0].uuid == workflowNext.uuid) {
                    let changes = args[0].actor.effects.find(e => e.id == effect.id).changes;
                    changes.forEach(c => { c.value = c.value.replace("radiant", damageType); });
                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, changes: changes }] });
                    Hooks.off("midi-qol.RollComplete", hook2);
                }
            });
            Hooks.off("createActiveEffect", hook1);
        }
    });
} catch (err) {console.error("Spirit Guardians Macro - ", err)}

/*
try {
    const lastArg = args[args.length - 1];
    if (lastArg.tag == "OnUse" && lastArg.macroPass == "preActiveEffects" && (lastArg.actor.system.details.alignment.toLowerCase().includes("evil") || lastArg.workflow.defaultDamageType.toLowerCase() != "radiant") && lastArg.item.effects.find(e => e.name == "Spirit Guardians")) {
        const damageType = lastArg.workflow.defaultDamageType.toLowerCase() != "radiant" ? lastArg.workflow.defaultDamageType.toLowerCase() : lastArg.actor.system.details.alignment.toLowerCase().includes("evil") ? "necrotic" : "radiant";
        let hook1 = Hooks.on("createActiveEffect", async (effect) => {
            if (effect.name == "Spirit Guardians" && effect.parent.uuid == lastArg.actor.uuid) {
                let hook2 = Hooks.on("midi-qol.RollComplete", async (workflowNext) => {
                    if (lastArg.uuid == workflowNext.uuid) {
                        let changes = lastArg.actor.effects.find(e => e.id == effect.id).changes;
                        changes.forEach(c => { c.value = c.value.replace("radiant", damageType); });
                        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: lastArg.actor.uuid, updates: [{ _id: effect.id, changes: changes }] });
                        Hooks.off("midi-qol.RollComplete", hook2);
                    }
                });
                Hooks.off("createActiveEffect", hook1);
            }
        });
    } else if (args[0] == "on" && !isNaN(args[1]) && !isNaN(args[3]) && !lastArg.efData.origin.includes(lastArg.actorUuid) && (!game.combat || lastArg.tokenId == game.combat?.current?.tokenId)) {
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
                target: { value: 1, type: "creature", prompt: false },
                actionType: "save",
                consume: { type: null, target: null, amount: null, scale: false },
				uses: { prompt: false },
                damage: { parts: [[`${args[1]}d8`, args[2]]] },
                save: { ability: "wis", dc: args[3], scaling: "flat" }
            }
        }
        const item = new CONFIG.Item.documentClass(itemData, { parent: source ?? actor });
        await MidiQOL.completeItemRoll(item, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [lastArg.tokenUuid] });
    }
} catch (err) {console.error("Spirit Guardians Macro - ", err)}
*/