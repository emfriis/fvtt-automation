try {
	if (args[0].macroPass != "postActiveEffects") return;
	const effectData = {
		changes: [{ key: "flags.midi-qol.DR.all", mode: 2, value: `${args[0].damageRoll.total}`, priority: 20 }],
		disabled: false,
		duration: { seconds: 1, turns: 1 },
		flags: { dae: { specialDuration: ["combatEnd", "1Reaction", "isDamaged"] } },
		name: args[0].item.name,
		icon: args[0].item.img
	};
	await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
} catch (err) {console.error("Damage Reduction By Roll - ", err)}