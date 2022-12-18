const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "off") {
	const effectData = {
		changes: [{ key: "flags.midi-qol.flurry", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
		disabled: false,
		duration: { turns: 1, startTime: game.time.worldTime },
		flags: { dae: { specialDuration: ["1Attack"] } },
		icon: "icons/skills/melee/unarmed-punch-fist-blue.webp",
		label: "Flurry of Blows",
	};
	await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
}