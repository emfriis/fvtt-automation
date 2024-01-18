try {
    if (args[0] != "each") return;
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    const source = game.actors.get(lastArg.efData.origin.match(/Actor\.(.*?)\./)[1]) ?? canvas.tokens.placeables.find(t => t.actor && t.actor.id == lastArg.efData.origin.match(/Actor\.(.*?)\./)[1])?.actor;
    const damage = Math.floor(source.classes.paladin.system.levels / 2);
    if (!damage || actor.id == source.id) return;
    const hasFear = actor.effects.find(e => e.name == "Frightened" && e.origin.includes(source.id));
    if (!hasFear) return;
    const itemData = {
        name: "Aura of Conquest",
        img: "icons/magic/unholy/silhouette-evil-horned-giant.webp",
        type: "feat",
        flags: { midiProperties: { magiceffect: true }, autoanimations: { isEnabled: false } },
        system: {
            activation: { type: "special" },
            target: { value: 1, type: "creature" },
            actionType: "other",
            damage: { parts: [[`${damage}`, "psychic"]] }
        }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: source ?? actor });
    await MidiQOL.completeItemRoll(item, {}, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [lastArg.tokenUuid] });
} catch (err) {console.error("Aura of Conquest Macro - ", err)}