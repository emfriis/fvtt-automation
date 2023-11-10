try {
	if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects" && ["mwak", "rwak"].includes(args[0].item.system.actionType)) {
		const effectData = {
			changes: [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "EldritchStrike, preTargetSave", priority: 20, }, { key: "flags.midi-qol.eldritchStrike", mode: 2, value: args[0].actor.uuid, priority: 20, }],
			disabled: false,
			origin: args[0].item.uuid,
			label: "Eldritch Strike",
			icon: "icons/weapons/swords/sword-flanged-lightning.webp",
			duration: { rounds: 1, turns: 1, seconds: 7 },
			flags: { dae: { specialDuration: ["turnEndSource", "combatEnd"], stackable: "noneName" } }
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
	} else if (args[0].tag == "TargetOnUse" && args[0].macroPass == "preTargetSave" && args[0].workflow.item?.type == "spell" && args[0].workflow.saveDetails && args[0].options.actor.flags["midi-qol"]?.eldritchStrike?.includes(args[0].workflow.actor.uuid)) {
		const effect = args[0].options.actor.effects.find(e => e.label == "Eldritch Strike" && e.changes.find(c => c.key == "flags.midi-qol.eldritchStrike" && c.value.includes(args[0].workflow.actor.uuid)));
		if (!effect) return;
		await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].options.actor.uuid, effects: [effect.id] });
		args[0].workflow.saveDetails.disadvantage = true;
	}
} catch (err) {console.error("Eldritch Strike Macro - ", err)}