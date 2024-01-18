try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "preambleComplete") {
        await game.user.updateTokenTargets(args[0].targets.filter(t => !t.actor.flags["midi-qol"]?.saveImmunity?.includes(args[0].item.uuid)).map(t => t.id));
    } else if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects") {
        args[0].targets.filter(t => t.actor && !args[0].failedSaves.find(f => f.id == t.id)).forEach(async t => {
			const effectData = {
				name: `${args[0].item.name} Immunity`,
				icon: args[0].item.img,
				changes: [{ key: "flags.midi-qol.saveImmunity", mode: 2, value: `[${args[0].item.uuid}]`, priority: 20 }], 
				disabled: false,
				flags: { dae: { specialDuration: ["longRest"], stackable: "multi" } }
			}
			await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: t.actor.uuid, effects: [effectData] });
		});
    } else if (args[0].tag == "TargetOnUse" && args[0].macroPass == "isSaveSuccess" && args[0].options.actor.effects.find(e => e.changes.find(c => c.key == "flags.midi-qol.OverTime" && c.value.includes(args[0].item.name)))) {
		let hook = Hooks.on("deleteActiveEffect", async (effect) => {
			console.error(effect);
			if (effect.parent.uuid == args[0].options.actor.uuid && effect.changes.find(c => c.key == "flags.midi-qol.OverTime" && c.value.includes(args[0].item.name))) {
				const effectData = {
					name: `${effect.name} Immunity`,
					icon: args[0].item.img,
					changes: [{ key: "flags.midi-qol.saveImmunity", mode: 2, value: `[${effect.origin}]`, priority: 20 }], 
					disabled: false,
					flags: { dae: { specialDuration: ["longRest"], stackable: "multi" } }
				}
				await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].options.actor.uuid, effects: [effectData] });
				Hooks.off("deleteActiveEffect", hook);
			}
		});
	}
} catch (err) {console.error("Immune Save Macro - ", err)}