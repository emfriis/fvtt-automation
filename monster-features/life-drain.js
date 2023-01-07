// life drain
// on use post effects

if (args[0].tag === "OnUse") {
	for (let t = 0; args[0].hitTargets.length; t++) {
		const tokenTarget = args[0].hitTargets[t];
		const tactorTarget = tokenTarget.actor;
		if (!tactorTarget) return;

		const necroticTotal = args[0].damageTotal;
		const necroticRes = (tactorTarget.data.data.traits.di?.value).includes("necrotic") ? 0 : (tactorTarget.data.data.traits.dr?.value).includes("necrotic") ? 0.5 : 1;
		const necroticVul = (tactorTarget.data.data.traits.dv?.value).includes("necrotic") ? 2 : 1;
		const necroticFinal = Math.floor(necroticTotal * necroticRes) * necroticVul;

		if (necroticFinal > 0) {
			const effectData = {
				changes: [{ key: "data.attributes.hp.max", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: -necroticFinal, priority: 20, }],
				disabled: false,
				flags: { dae: { specialDuration: ["longRest"], stackable: "multi" } },
				icon: args[0].item.img,
				label: `${args[0].item.name} Affliction`,
			};
			await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
		}
	}
}