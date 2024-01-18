try {
	const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
	const source = game.actors.get(lastArg.efData.origin.match(/Actor\.(.*?)\./)[1]) ?? canvas.tokens.placeables.find(t => t.actor && t.actor.id == lastArg.efData.origin.match(/Actor\.(.*?)\./)[1])?.actor;
    if (!((args[0] == "on" && game.combat?.current?.tokenId == args[0].tokenId) || args[0] == "each") || actor.system.traits.ci.value.has("frightened") || actor.id == source.id) return;
	const itemData = {
        name: "Avenging Angel",
        img: "icons/creatures/mammals/bat-giant-tattered-purple.webp",
        type: "feat",
        system: {
            activation: { type: "special" },
            target: { type: "creature" },
            actionType: "save",
            save: { ability: "wis", dc: isNaN(args[1]) ? source.system.attributes.spelldc : args[1], scaling: "flat" },
        },
        effects: [{ 
            changes: [{ key: "macro.CE", mode: 0, value: "Frightened", priority: 20 }], 
            disabled: false,
            transfer: false,
            isSuppressed: false, 
            icon: "icons/creatures/mammals/bat-giant-tattered-purple.webp", 
            name: "Avenging Angel", 
            duration: { seconds: 60 },
			flags: { dae: { specialDuration: ["isDamaged"] } },
            origin: lastArg.efData.origin
        }],
        flags: { midiProperties: { magiceffect: true }, autoanimations: { isEnabled: false } }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: source ?? actor });
    await MidiQOL.completeItemRoll(item, {}, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [lastArg.tokenUuid] });
} catch (err)  {console.error("Avenging Angel Macro - ", err)}
