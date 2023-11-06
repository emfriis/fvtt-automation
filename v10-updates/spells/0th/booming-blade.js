try {
	if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
		const level = args[0].actor.type === "character" ? args[0].actor.system.details.level : args[0].actor.system.details.cr;
		const cantripDice = Math.floor((level + 1) / 6) + 1;
		const weapons = args[0].actor.items.filter((i) => i.data.type === "weapon" && i.system.equipped && i.system.actionType == "mwak" && ["simple","martial"].find(t => i.system.weaponType.toLowerCase().includes(t)));
		let weapon_content = "";
		weapons.forEach((weapon) => { weapon_content += `<label class="radio-label"><input type="radio" name="weapon" value="${weapon.id}"><img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">${weapon.data.name}</label>`; });
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
			title: "Booming Blade: Choose a weapon",
			content,
			buttons: {
				Ok: {
					label: "Ok",
					callback: async () => {
						const weapon = args[0].actor.items.find(i => i.id == $("input[type='radio'][name='weapon']:checked").val());
						const weaponCopy = await mergeObject(duplicate(weapon), {"id": null, "_id": null, "system.damage.parts": cantripDice > 1 ? weapon.system.damage.parts.concat([[`${cantripDice - 1}d8`, args[0].workflow.defaultDamageType]]) : weapon.system.damage.parts, "system.damage.versatile": weapon.system.damage.versatile && cantripDice > 1 ? weapon.system.damage.versatile + `${cantripDice - 1}d8[${args[0].workflow.defaultDamageType}]` : "" });
						weaponCopy.effects.push({ name: "Booming Blade", icon: args[0].item.img, origin: args[0].item.uuid, transfer: false, disabled: false, isSuppressed: false, duration: { rounds: 1 }, flags: { dae: { specialDuration: ["turnStartSource"], transfer: false, stackable: "noneName" } }, changes: [{ key: "macro.execute", mode: 0, value: `BoomingBlade ${cantripDice}d8 ${args[0].workflow.defaultDamageType}`, priority: "20" }] });
						const attackItem = await new CONFIG.Item.documentClass(weaponCopy, { parent: args[0].actor });
						await MidiQOL.completeItemRoll(attackItem, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [args[0].targetUuids[0]] });
					},
				},
				Cancel: { label: "Cancel" },
			},
		}).render(true);
	} else if (args[0] === "off" && !args[args.length - 1]["expiry-reason"]) {
		const lastArg = args[args.length - 1];
		const source = game.actors.get(lastArg.efData.origin.match(/Actor\.(.*?)\./)[1]) ?? canvas.tokens.placeables.find(t => t.actor && t.actor.id == lastArg.efData.origin.match(/Actor\.(.*?)\./)[1])?.actor;
		if (!source) return;
		const damageItemData = {
			name: "Booming Blade",
			img: args[args.length - 1].efData.icon,
			type: "feat",
			flags: { midiProperties: { magiceffect: true }, autoanimations: { isEnabled: false } },
			system: {
				activation: { type: "special", },
				target: { type: "creature", },
				actionType: "other",
				damage: { parts: [[args[1], args[2]]] }
			}
		}
		const damageItem = new CONFIG.Item.documentClass(damageItemData, { parent: source });
		await MidiQOL.completeItemUse(damageItem, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [lastArg.tokenUuid] });
	}
} catch (err) {console.error(`Booming Blade Macro - `, err)}