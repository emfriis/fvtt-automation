try {
    if (args[0] != "each") return;
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    const source = canvas.tokens.placeables.find(t => t.actor && t.actor.id == lastArg.efData.origin.match(/Actor\.(.*?)\./)[1]).actor;
    const damage = Math.floor(source.classes.paladin.system.levels / 2);
    if (!source || !damage) return;
    const hasFear = actor.effects.find(e => e.label == "Frightened" && e.origin.includes(source.id));
    if (!hasFear) return;
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
} catch (err) {console.error("Aura of Conquest Macro - ", err)}
