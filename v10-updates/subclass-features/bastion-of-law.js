try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects") {
		let target = args[0].hitTargets[0].actor;
		let usesItem = args[0].actor.items.find(i => i.name === "Font of Magic" && i.system.uses);
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
		const effectData = {
			label: args[0].item.name,
			icon: args[0].item.img,
			origin: args[0].item.uuid,
			disabled: false,
			flags: { dae: { specialDuration: ["longRest"], showIcon: true } },
			changes: [{ key: "macro.execute", mode: 0, value: `BastionOfLaw ${shield}`, priority: "20" }]
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
		await usesItem.update({"system.uses.value": Math.max(0, usesItem.system.uses.value - +shield)});
	} else if (args[0] == "on") {
		const shield = args[1]; 
		const lastArg = args[args.length - 1];
		const tokenOrActor = await fromUuid(lastArg.actorUuid);
		const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
		const itemData = {
			name: "Bastion of Law",
			img: "icons/equipment/shield/buckler-wooden-triangle-brown.webp",
			type: "consumable",
			system: {
				description: { value: "The ward lasts until you finish a long rest or until you use this feature again. The ward is represented by a number of d8s equal to the number of sorcery points spent to create it. When the warded creature takes damage, it can expend a number of those dice, roll them, and reduce the damage taken by the total rolled on those dice." },
				consumableType: "trinket",
				equipped: true,
				activation: { type: "special" },
				target: { type: "self" },
				range: { units: "self" },
				uses: { value: shield, max: shield, per: "charges", autoDestroy: true },
				actionType: "other",
				damage: { parts: [["1d8", "midi-none"]] }
			}
		}
		await actor.createEmbeddedDocuments("Item", [itemData]);
		const item = actor.items.find(i => i.name == "Bastion of Law" && i.type == "consumable");
		if (item && lastArg.efData._id) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: lastArg.efData._id, changes: [{ key: "flags.dae.deleteUuid", mode: 5, value: item.uuid, priority: "20" }] }] });
	}
} catch (err)  {console.error("Bastion of Law Macro - ", err); }