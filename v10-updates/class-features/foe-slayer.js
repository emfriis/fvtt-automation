try {
	if (!args[0].targets.length || !["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType) || (game.combat && args[0].actor.effects.find(e => e.name == "Used Foe Slayer" && !e.disabled)) || (game.combat && game.combat?.current?.tokenId != args[0].tokenId))	 return;
	const monsterType = args[0].targets[0].actor.system.details?.type ? (args[0].targets[0].actor.system.details?.type?.value.toLowerCase().includes("humanoid") ? args[0].targets[0].actor.system.details?.type?.subtype.toLowerCase() : args[0].targets[0].actor.system.details?.type?.value.toLowerCase()) : (args[0].targets[0].actor.system.details?.race.toLowerCase().includes("humanoid") ? args[0].targets[0].actor.system.details?.race.toLowerCase().replace("humanoid", "") : args[0].targets[0].actor.system.details?.race.toLowerCase());
	if (!((args[0].targets[0].actor.effects.find(e => e.name == "Favored Foe") && args[0].targets[0].actor.flags["midi-qol"]?.favoredFoe.includes(args[0].actor.uuid)) || args[0].actor.flags["midi-qol"]?.favoredEnemy?.split(" ").find(c => monsterType.includes(c)))) return;
	if (args[0].macroPass == "preCheckHits" && args[0].attackRoll) {
		let useFeat = true;
		if (game.combat) {
			let dialog = new Promise((resolve) => {
				new Dialog({
				title: "Usage Configuration: Foe Slayer",
				content: `<p>Use Foe Slayer to add your wisdom modifier to the attack roll?<br>(Attack Roll Total: ${args[0].attackRoll.total})</p>`,
				buttons: {
					confirm: {
						icon: '<i class="fas fa-check"></i>',
						label: "Confirm",
						callback: () => resolve(true)
					},
					cancel: {
						icon: '<i class="fas fa-times"></i>',
						label: "Cancel",
						callback: () => resolve(false)
					}
				},
				default: "cancel",
				close: () => {resolve(false)}
				}).render(true);
			});
			useFeat = await dialog;
		}
		if (!useFeat) return;
		if (game.combat) {
			const effectData = {
				disabled: false,
				flags: { dae: { specialDuration: ["turnStart", "combatEnd"] } },
				icon: "icons/skills/ranged/arrow-flying-poisoned-green.webp",
				name: "Used Foe Slayer"
			}
			await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
		}
		let bonusRoll = await new Roll('0 + ' + `${args[0].actor.system.abilities.wis.mod}`).evaluate({async: true});
		for (let i = 1; i < bonusRoll.terms.length; i++) {
			args[0].attackRoll.terms.push(bonusRoll.terms[i]);
		}
		args[0].attackRoll._total += bonusRoll.total;
		args[0].attackRoll._formula = args[0].attackRoll._formula + ' + ' + `${args[0].actor.system.abilities.wis.mod}`;
		args[0].workflow.setAttackRoll(args[0].attackRoll);
	} else if (args[0].macroPass == "postDamageRoll" && args[0].hitTargets.length && args[0].damageRoll) {
		let useFeat = true;
		if (game.combat) {
			let dialog = new Promise((resolve) => {
				new Dialog({
				title: "Usage Configuration: Foe Slayer",
				content: `<p>Use Foe Slayer to add your wisdom modifier to the damage roll?</p>`,
				buttons: {
					confirm: {
						icon: '<i class="fas fa-check"></i>',
						label: "Confirm",
						callback: () => resolve(true)
					},
					cancel: {
						icon: '<i class="fas fa-times"></i>',
						label: "Cancel",
						callback: () => resolve(false)
					}
				},
				default: "cancel",
				close: () => {resolve(false)}
				}).render(true);
			});
			useFeat = await dialog;
		}
		if (!useFeat) return;
		if (game.combat) {
			const effectData = {
				disabled: false,
				flags: { dae: { specialDuration: ["turnStart", "combatEnd"] } },
				icon: "icons/skills/ranged/arrow-flying-poisoned-green.webp",
				name: "Used Foe Slayer"
			}
			await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
		}
		let bonusRoll = await new Roll('0 + ' + `${args[0].actor.system.abilities.wis.mod}`).evaluate({async: true});
		for (let i = 1; i < bonusRoll.terms.length; i++) {
			args[0].damageRoll.terms.push(bonusRoll.terms[i]);
		}
		args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${args[0].actor.system.abilities.wis.mod}`;
		args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
		await args[0].workflow.setDamageRoll(args[0].damageRoll);
	}
} catch (err) {console.error("Foe Slayer Macro - ", err)}