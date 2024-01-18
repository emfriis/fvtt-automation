try {
	if (args[0].macroPass != "postDamageRoll" || !args[0].hitTargets.length || !args[0].damageRoll || !["mwak", "rwak"].includes(args[0].item.system.actionType) || (game.combat && args[0].actor.effects.find(e => e.name == "Used Favored Foe" && !e.disabled)) || (game.combat && game.combat?.current?.tokenId != args[0].tokenId)) return;
	const item = args[0].actor.items.find(i => i.name == "Favored Foe" && i.system.uses.value);
	if (args[0].targets[0].actor.effects.find(e => e.name == "Favored Foe") && args[0].targets[0].actor.flags["midi-qol"]?.favoredFoe.includes(args[0].actor.uuid) && !(game.combat && args[0].actor.effects.find(e => e.name == "Used Favored Foe" && disabled == false))) {
		if (game.combat) {
			const effectData = {
				disabled: false,
				flags: { dae: { specialDuration: ["turnStart", "combatEnd"] } },
				icon: "icons/creatures/abilities/paw-print-yellow.webp",
				name: "Used Favored Foe"
			}
			await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
		}
		const faces = args[0].actor.system.scale?.ranger?.["favored-foe"] ?? 4;
		const diceMult = args[0].isCritical ? 2: 1;
		let bonusRoll = await new Roll('0 + ' + `${diceMult}${faces}`).evaluate({async: true});
		for (let i = 1; i < bonusRoll.terms.length; i++) {
			args[0].damageRoll.terms.push(bonusRoll.terms[i]);
		}
		args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${diceMult}${faces}`;
		args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
		await args[0].workflow.setDamageRoll(args[0].damageRoll);
	} else if (item && !(args[0].targets[0].actor.effects.find(e => e.name == "Favored Foe") && args[0].targets[0].actor.flags["midi-qol"]?.favoredFoe.includes(args[0].actor.uuid)) && args[0].targets[0].actor.uuid != args[0].actor.uuid) {
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
		await MidiQOL.completeItemUse(item, { showFullCard: false, createWorkflow: true, configureDialog: false, targetUuids: [args[0].targets[0].uuid] });
		if (game.combat) {
			const effectData = {
				disabled: false,
				flags: { dae: { specialDuration: ["turnStart", "combatEnd"] } },
				icon: "icons/creatures/abilities/paw-print-yellow.webp",
				name: "Used Favored Foe"
			}
			await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
		}
		const faces = args[0].actor.system.scale?.ranger?.["favored-foe"] ?? "d4";
		const diceMult = args[0].isCritical ? 2: 1;
		let bonusRoll = await new Roll('0 + ' + `${diceMult}${faces}`).evaluate({async: true});
		if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
		for (let i = 1; i < bonusRoll.terms.length; i++) {
			args[0].damageRoll.terms.push(bonusRoll.terms[i]);
		}
		args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${diceMult}${faces}`;
		args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
		await args[0].workflow.setDamageRoll(args[0].damageRoll);
	}
} catch (err) {console.error("Favored Foe Macro - ", err)}