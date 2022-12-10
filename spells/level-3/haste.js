// haste

if(args[0] === "off") {
	const lastArg = args[args.length - 1];
	const tokenOrActor = await fromUuid(lastArg.actorUuid);
	const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

    const effectData = {
		changes: [
			{
				key: "data.attributes.movement.all",
				mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
				value: "0",
				priority: 20,
			}, 
		],
		disabled: false,
		flags: { dae: { specialDuration: ["turnEnd"] }, core: { statusId: "Haste Fatigue" } },
		icon: "systems/dnd5e/icons/spells/haste-royal-2.jpg",
		label: "Haste Fatigue",
	};
	await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [effectData] });
}