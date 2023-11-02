try {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    const effectData = {
        changes: [{ key: "system.attributes.movement.all", mode: 0, value: "0", priority: 20 }], 
        disabled: false,
        transfer: false,
        isSuppressed: false, 
        icon: "icons/magic/unholy/silhouette-evil-horned-giant.webp", 
        name: "Aura of Conquest Movement Reduction", 
        duration: { rounds: 1, seconds: 7 },
        flags: { dae: { specialDuration: ["turnStart"] } }
    }
    if (args[0].tag == "TargetOnUse" && ["isAttacked", "preTargetSave"].includes(args[0].macroPass)) {
        let hook = Hooks.on("midi-qol.RollComplete", async workflowNext => {
            if (workflowNext.uuid === args[0].uuid) {
                const sourceId = args[0].options.actor.effects.find(e => e.label == "Aura of Conquest").origin.match(/Actor\.(.*?)\./)[1];
                const hasFear = actor.effects.find(e => e.label == "Frightened" && e.origin.includes(sourceId));
                if (hasFear) await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].options.actor.uuid, effects: [effectData] });
                Hooks.off("midi-qol.RollComplete", hook);
            }
        });
    } else {
        console.error(actor.effects.find(e => e.label == "Aura of Conquest Movement Reduction"))
        const source = game.actors.get(lastArg.efData.origin.match(/Actor\.(.*?)\./)[1]);
        const damage = Math.floor(source.classes.paladin.system.levels / 2);
        if (!source || !damage) return;
        const hasFear = actor.effects.find(e => e.label == "Frightened" && e.origin.includes(source.id));
        if (!hasFear) return;
        if (args[0] == "on") {
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [effectData] });
        } else if (args[0] == "off") {
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: actor.uuid, effects: [actor.effects.find(e => e.label == "Aura of Conquest Movement Reduction").id] });
        } else if (args[0] == "each") {
            const itemData = {
                name: "Aura of Conquest",
                img: "icons/magic/unholy/silhouette-evil-horned-giant.webp",
                type: "feat",
                flags: { midiProperties: { magiceffect: true, effectActivation: true }, autoanimations: { isEnabled: false } },
                system: {
                    activation: { type: "special", condition: "!target.effects.find(e=>e.label=='Aura of Conquest Movement Reduction')" },
                    target: { type: "self" },
                    range: { units: "self" },
                    actionType: "other",
                    damage: { parts: [[`${damage}`, "psychic"]] }
                },
                effects: [effectData],
            }
            const item = new CONFIG.Item.documentClass(itemData, { parent: actor });
            await MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
        }
    }
} catch (err) {console.error("Aura of Conquest Macro - ", err)}
