try {
	if (!game.combat || game.combat?.round != 1) return;
	if (args[0].macroPass == "preAttackRoll" && !actor.effects.find(e => e.name == "Used Dread Ambusher")) {
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
			name: "Used Dread Ambusher",
			disabled: false,
			duration: { turns: 1, seconds: 1 },
			flags: { dae: { specialDuration: ["turnEnd", "combatEnd"] } }
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [effectData] });
		args[0].workflow.dreadAmbusher = true;
	} else if (args[0].macroPass == "postDamageRoll" && args[0].hitTargets.length && args[0].damageRoll && args[0].workflow.dreadAmbusher) {
		const diceMult = args[0].isCritical ? 2 : 1;
		let bonusRoll = await new Roll('0 + ' + `${diceMult}d8`).evaluate({async: true});
		for (let i = 1; i < bonusRoll.terms.length; i++) {
			args[0].damageRoll.terms.push(bonusRoll.terms[i]);
		}
		args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${diceMult}d8`;
		if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
		args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
		await args[0].workflow.setDamageRoll(args[0].damageRoll);
	} else if (args[0] == "each") {
		const effectData = {
			name: "Dread Ambusher Movement Bonus",
			icon: "icons/skills/ranged/bow-arrows-blue.webp",
			changes: [{ key: "system.attributes.movement.walk", mode: 2, value: "10", priority: 20 }],
			disabled: false,
			duration: { turns: 1, seconds: 1 },
			flags: { dae: { specialDuration: ["turnEnd", "combatEnd"] } }
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [effectData] });
	}
} catch (err)  {console.error("Dread Ambusher Macro - ", err)}