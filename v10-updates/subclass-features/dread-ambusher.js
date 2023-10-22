try {
	if (!game.combat || game.combat?.round !== 1) return;
    const effectData = {
        label: "Dread Ambusher Movement Bonus",
        icon: "icons/skills/ranged/bow-arrows-blue.webp",
        changes: [
			{ key: "system.attributes.movement.walk", mode: 2, value: "10", priority: 20 }
		],
        disabled: false,
		duration: { turns: 1 },
        flags: { dae: { specialDuration: ["turnEnd"] } }
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [effectData] });
} catch (err)  {console.error("Dread Ambusher Macro - ", err)}

try {
	if (!game.combat || game.combat?.round !== 1) return;
	if (args[0].tag === "OnUse" && args[0].macroPass === "preAttackRoll" && !actor.effects.find(e => e.label === "Used Dread Ambusher")) {
		let useFeat = true;
		let dialog = new Promise((resolve) => {
			new Dialog({
			title: "Usage Configuration: Dread Ambusher",
			content: `<p>Use Dread Ambusher to add 1d8 to the damage of this attack?</p>`,
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
		useFeat = await dialog;
		if (!useFeat) return;
		const effectData = {
			label: "Used Dread Ambusher",
			disabled: false,
			duration: { turns: 1, seconds: 1 }
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [effectData] });
		args[0].workflow.dreadAmbusher = true;
	} else if (args[0].tag === "DamageBonus" && args[0].damageRoll && args[0].workflow.dreadAmbusher) {
		const diceMult = args[0].isCritical ? 2 : 1;
		return { damageRoll: `${diceMult}d8`, flavor: "Dread Ambusher" };
	} else if (args[0] === "each") {
		const effectData = {
			label: "Dread Ambusher Movement Bonus",
			icon: "icons/skills/ranged/bow-arrows-blue.webp",
			changes: [
				{ key: "system.attributes.movement.walk", mode: 2, value: "10", priority: 20 }
			],
			disabled: false,
			duration: { turns: 1 },
			flags: { dae: { specialDuration: ["turnEnd"] } }
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [effectData] });
	}
} catch (err)  {console.error("Dread Ambusher Macro - ", err)}