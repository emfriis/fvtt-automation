try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postActiveEffects") return;
	const level = args[0].actor.type == "character" ? args[0].actor.system.details.level : args[0].actor.system.details.cr;
	const cantripDice = Math.floor((level + 1) / 6) + 1;
	const weapons = args[0].actor.items.filter((i) => i.type == "weapon" && i.system.equipped && i.system.actionType == "mwak" && ["simple","martial"].find(t => i.system.weaponType.toLowerCase().includes(t)));
	let weapon_content = "";
	weapons.forEach((weapon) => { weapon_content += `<label class="radio-label"><input type="radio" name="weapon" value="${weapon.id}"><img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">${weapon.name}</label>`; });
	let content = `
		<style>
		.weapon .form-group { display: flex; flex-wrap: wrap; width: 100%; align-items: flex-start; }
		.weapon .radio-label { display: flex; flex-direction: column; align-items: center; text-align: center; justify-items: center; flex: 1 0 25%; line-height: normal; }
		.weapon .radio-label input { display: none; }
		.weapon img { border: 0px; width: 50px; height: 50px; flex: 0 0 50px; cursor: pointer; }
		.weapon [type=radio]:checked + img { outline: 2px solid #f00; }
		</style>
		<form class="weapon">
		<div class="form-group" id="weapons">
			${weapon_content}
		</div>
		</form>
	`;
	new Dialog({
		title: "Green Flame Blade: Choose a weapon",
		content,
		buttons: {
			Ok: {
				label: "Ok",
				callback: async () => {
					const weapon = args[0].actor.items.find(i => i.id == $("input[type='radio'][name='weapon']:checked").val());
					const weaponCopy = await mergeObject(duplicate(weapon), { "_id": null, "system.damage.parts": cantripDice > 1 ? weapon.system.damage.parts.concat([[`${cantripDice - 1}d8`, args[0].workflow.defaultDamageType]]) : weapon.system.damage.parts, "system.damage.versatile": weapon.system.damage.versatile && cantripDice > 1 ? weapon.system.damage.versatile + `${cantripDice - 1}d8[${args[0].workflow.defaultDamageType}]` : "" });
					const attackItem = await new CONFIG.Item.documentClass(weaponCopy, { parent: args[0].actor });
					attackItem.system.prof = weapon.system.prof;
					const attackWorkflow = await MidiQOL.completeItemRoll(attackItem, { versatile: args[0].workflow.pressedKeys.versatile, showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [args[0].targetUuids[0]] });
					if (!attackWorkflow.targets.size) return;
					new Dialog({
						title: "Green Flame Blade: Additional Target",
						content: `<p>Target another creature for the flames to leap to.</p>`,
						buttons: {
							Ok: {
								label: "Ok",
								callback: async () => { 
									let target = game.user?.targets?.first();
									if (!target || attackWorkflow.targets.has(target)) return;
									if (MidiQOL.getDistance(attackWorkflow.targets.values().next().value, target, false) > 5) return ui.notifications.warn(`Target too far away (${MidiQOL.getDistance(attackWorkflow.targets.values().next().value, target, false)} Feet)`);
									const mod = args[0].actor.system.abilities[args[0].item.system.ability ? args[0].item.system.ability : args[0].actor.system.attributes.spellcasting ? args[0].actor.system.attributes.spellcasting : "int"].mod;
									const damageItemData = {
										name: "Green Flame Blade",
										img: args[0].item.img,
										type: "feat",
										flags: { midiProperties: { magiceffect: true }, autoanimations: { isEnabled: false } },
										system: {
											activation: { type: "special" },
											target: { value: 1, type: "creature", prompt: false },
											actionType: "other",
											consume: { type: null, target: null, amount: null, scale: false },
											uses: { prompt: false },
											damage: { parts: [[`${cantripDice > 0 ? (cantripDice - 1) + "d8 + " + mod : mod}`, args[0].workflow.defaultDamageType]] }
										}
									}
									const damageItem = new CONFIG.Item.documentClass(damageItemData, { parent: args[0].actor });
									await MidiQOL.completeItemUse(damageItem, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [lastArg.tokenUuid] });
								},
							},
							Cancel: { label: "Cancel" },
						},
					}).render(true);
				},
			},
			Cancel: { label: "Cancel" },
		},
	}).render(true);
} catch (err) {console.error(`Green Flame Blade Macro - `, err)}