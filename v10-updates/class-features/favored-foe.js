try {
	if (args[0].tag !== "DamageBonus" || !args[0].damageRoll || !["mwak", "rwak"].includes(args[0].item.system.actionType) || (game.combat && args[0].actor.effects.find(e => e.label === "Used Favored Foe"))) return;
	const item = args[0].actor.items.find(i => i.name === "Favored Foe" && i.system.uses.value);
	if (args[0].targets[0].actor.effects.find(e => e.label === "Favored Foe") && args[0].targets[0].actor.flags["midi-qol"]?.favoredFoe.includes(args[0].actor.uuid) && !(game.combat && args[0].actor.effects.find(e => e.label === "Used Favored Foe" && disabled == false))) {
		if (game.combat) {
			const effectData = {
				disabled: false,
				duration: { rounds: 1, seconds: 7 },
				flags: { dae: { specialDuration: ["turnStart"] } },
				label: "Used Favored Foe",
			}
			await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
		}
		const faces = args[0].actor.system.scale?.ranger?.["favored-foe"] ?? 4;
		const diceMult = args[0].isCritical ? 2: 1;
		return {damageRoll: `${diceMult}${faces}`, flavor: "Favored Foe"};
	} else if (item && !(args[0].targets[0].actor.effects.find(e => e.label === "Favored Foe") && args[0].targets[0].actor.flags["midi-qol"]?.favoredFoe.includes(args[0].actor.uuid)) && args[0].targets[0].actor.uuid !== args[0].actor.uuid) {
		let dialog = new Promise((resolve) => {
            new Dialog({
            title: "Usage Configuration: Favored Foe",
            content: `<p>Use Favored Foe to mark your target?</p>`,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: () => resolve(true)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => {resolve(false)}
                }
            },
            default: "cancel",
            close: () => {resolve(false)}
            }).render(true);
        });
        let useFeat = await dialog;
		if (!useFeat) return;
		await MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false, targetUuids: [args[0].targets[0].uuid] });
		if (game.combat) {
			const effectData = {
				disabled: false,
				duration: { rounds: 1, seconds: 7 },
				flags: { dae: { specialDuration: ["turnStart"] } },
				label: "Used Favored Foe",
			}
			await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
		}
		const faces = args[0].actor.system.scale?.ranger?.["favored-foe"] ?? 4;
		const diceMult = args[0].isCritical ? 2: 1;
		return {damageRoll: `${diceMult}d${faces}`, flavor: "Favored Foe"};
	}
} catch (err) {console.error("Favored Foe Macro - ", err)}
