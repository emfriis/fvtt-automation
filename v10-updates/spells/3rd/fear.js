try {
    if (args[0] != "each") return;
    const lastArg = args[args.length - 1];
    const token = canvas.tokens.get(lastArg.tokenId);
	const tokenOrActor = await fromUuid(lastArg.actorUuid);
	const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    const source = canvas.tokens.placeables.find(t => t.actor && t.actor.id == lastArg.efData.origin.match(/Actor\.(.*?)\./)[1]);
    if (MidiQOL.canSense(token, source)) return;
    const itemData = {
        name: "Fear (Frightened)",
        img: "icons/magic/control/fear-fright-monster-purple-blue.webp",
        type: "feat",
        flags: { midiProperties: { magiceffect: true }, autoanimations: { isEnabled: false } },
        system: {
            activation: { type: "special" },
            target: { type: "self" },
            range: { units: "self" },
            actionType: "save",
            save: { ability: "wis", dc: `${isNaN(args[1]) ? source.actor.system.attributes.spelldc : args[1]}`, scaling: "flat" },
        }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: actor });
    const saveWorkflow = await MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
    if (saveWorkflow.failedSaves.size) return;
    await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: actor.uuid, effects: [lastArg.efData._id] });
} catch (err) {console.error("Fear Macro - ", err)}