try {
    if (args[0].macroPass == "postActiveEffects") {
		let usesItem = args[0].actor.items.find(i => i.name === "Font of Magic" && i.system.uses?.value);
        if (!usesItem) return;
		let uses = usesItem.system.uses.value;
		let shield = await new Promise((resolve) => {
			new Dialog({
				title: "Bastion of Law",
				content: `
                <form id="use-form">
					<p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Bastion of Law", type: "feature"}) + `</p>
					<p>Expend 1 to 5 Sorcery Points to create a magical ward:</p>
					<div class="form-group">
						<label>(${uses} Sorcery Points Remaining)</label>
						<div class="form-fields">
							<input id="shield" name="shield" type="number" min="1" max="5"></input>
						</div>
					</div>
				</form>
				`,
				buttons: {
					confirm: {
						icon: '<i class="fas fa-check"></i>',
						label: "Confirm",
						callback: () => {
							if (uses >= Math.min(5, $('#shield')[0].value)) {
								resolve(Math.min(5, $('#shield')[0].value));
							} else {
								ui.notifications.warn("Not enough Sorcery Points Remaining"); 
							}
						}
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
		if (!shield) return;
		const effectData1 = {
			name: "Bastion of Law Shield",
			icon: args[0].item.img,
			origin: args[0].item.uuid,
			disabled: false,
			flags: { dae: { showIcon: true } },
			changes: [{ key: "flags.midi-qol.bastionOfLaw", mode: 0, value: shield, priority: "20" }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.HAte6vEtTdLKZ64m, preTargetDamageApplication", priority: "20" }]
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData1] });
		const effectData2 = {
			name: "Bastion of Law",
			icon: args[0].item.img,
			origin: args[0].item.uuid,
			disabled: false,
			flags: { dae: { specialDuration: ["longRest"] } }
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData2] });
		const effect1 = args[0].targets[0].actor.effects.find(e => e.name == "Bastion of Law Shield" && e.origin == args[0].item.uuid);
		const effect2 = args[0].actor.effects.find(e => e.name == "Bastion of Law" && e.origin == args[0].item.uuid);
		if (effect1 && effect2) {
			await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].targets[0].actor.uuid, updates: [{ _id: effect1.id, changes: effect1.changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: effect2.uuid, priority: 20 }]) }] });
			await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect2.id, changes: effect2.changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: effect1.uuid, priority: 20 }]) }] });
		}
		await usesItem.update({"system.uses.value": Math.max(0, usesItem.system.uses.value - +shield)});
	} else if (args[0].macroPass == "preTargetDamageApplication" && workflow.damageItem.totalDamage) {
		let uses = args[0].actor.flags["midi-qol"]?.bastionOfLaw;
		let usesEffect = args[0].actor.effects.find(e => e.name == "Bastion of Law Shield");
		let dialog = await new Promise((resolve) => {
			new Dialog({
				title: "Bastion of Law",
				content: `
                <form id="use-form">
					<p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Bastion of Law", type: "feature"}) + `</p>
					<p>Expend up to ${uses}d8 to Reduce Damage:</p>
					<div class="form-group">
						<label>(${uses} Bastion of Law Dice Remaining)</label>
						<div class="form-fields">
							<input id="shield" name="shield" type="number" min="1" max=${uses}></input>
						</div>
					</div>
				</form>
				`,
				buttons: {
					confirm: {
						icon: '<i class="fas fa-check"></i>',
						label: "Confirm",
						callback: () => {
							if (uses >= Math.min(uses, $('#shield')[0].value)) {
								resolve(Math.min(uses, $('#shield')[0].value));
							} else {
								ui.notifications.warn("Not enough Bastion of Law Dice Remaining"); 
							}
						}
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
		let spend = await dialog;
		if (!spend) return;
		let shieldRoll = await new Roll(`${spend}d8`).evaluate({async: true});
		if (game.dice3d) game.dice3d.showForRoll(shieldRoll);
		let dr = shieldRoll.total;
		const hpDmg = workflow.damageItem.hpDamage;
		const tempDmg = workflow.damageItem.tempDamage;
		// hp damage recalc
		workflow.damageItem.hpDamage = Math.max(0, workflow.damageItem.hpDamage - dr);
		dr = Math.max(0, dr - hpDmg);
		workflow.damageItem.newHP = workflow.damageItem.oldHP - workflow.damageItem.hpDamage;
		// temp hp damage recalc
		workflow.damageItem.tempDamage = Math.max(0, workflow.damageItem.tempDamage - dr);
		dr = Math.max(0, dr - tempDmg);
		workflow.damageItem.newTempHP = workflow.damageItem.oldTempHP - workflow.damageItem.tempDamage;
		ChatMessage.create({ content: `Bastion of Law: ${shieldRoll.total} Damage Negated.` });
		if (uses - spend > 0) {
			await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: usesEffect.id, changes: [{ key: "flags.midi-qol.bastionOfLaw", mode: 0, value: uses - spend, priority: "20" }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.HAte6vEtTdLKZ64m, preTargetDamageApplication", priority: "20" }] }] });
		} else {
			await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [usesEffect.id] });
		}
	}
} catch (err)  {console.error("Bastion of Law Macro - ", err); }