try {
	if (args [0] == "each") {
		const lastArg = args[args.length - 1];
		const tokenOrActor = await fromUuid(lastArg.actorUuid);
		const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
		const damage = actor.system.attributes.prof;
		const itemData = {
			name: "Radiant Consumption",
			img: "icons/magic/holy/projectiles-blades-salvo-yellow.webp",
			type: "feat",
			flags: { "midi-qol": { onUseMacroName: "[preambleComplete]TargetIgnoreSelf", onUseMacroParts: { items: [{ macroName: "TargetIgnoreSelf", options: "preambleComplete" }] } }, midiProperties: { magiceffect: true }, autoanimations: { isEnabled: false } },
			system: {
				activation: { type: "special" },
				target: { type: "creature", value: 10, units: "ft" },
				range: "self",
				actionType: "other",
				damage: { parts: [[`${damage}`, "radiant"]] }
			}
		}
    const item = new CONFIG.Item.documentClass(itemData, { parent: actor });
    await MidiQOL.completeItemRoll(item, { showFullCard: true, createWorkflow: true, configureDialog: false });
    }
} catch (err) {console.error("Radiant Consumption Macro - ", err)}