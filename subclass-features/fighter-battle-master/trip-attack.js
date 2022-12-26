// trip attack
// damage bonus macro

try {

	if (args[0].tag !== "DamageBonus" || !["mwak", "rwak"].includes(args[0].itemData.data.actionType) || args[0].hitTargets.length < 1) return;
	const tokenOrActor = await fromUuid(args[0].actorUuid);
	const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
	const tokenOrActorTarget = await fromUuid(args[0].hitTargetUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
	const die = tactor.data.data.scale["battle-master"]["combat-superiority-die"];
    let item = tactor.items.find(i => i.name === "Combat Superiority");
	
	if (die && item && item.data.data.uses.value) {
		let dialog = new Promise((resolve, reject) => {
			new Dialog({
			title: "Trip Attack: Usage Configuration",
			content: `
			<form id="use-form">
				<p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Maneuvers: Trip Attack", type: "feature"}) + `</p>
				<p>Use a Superiority Die to use Trip Attack?</p>
				<p>(` + item.data.data.uses.value + ` Superiority Die Remaining)</p>
			</form>
			`,
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: "Confirm",
					callback: () => resolve(true)
				},
				two: {
					icon: '<i class="fas fa-times"></i>',
					label: "Cancel",
					callback: () => {resolve(false)}
				}
			},
			default: "two",
		    close: callBack => {resolve(false)}
			}).render(true);
		});
		maneuver = await dialog;
		
		if (!maneuver) return {};
		
		if (!item || !item.data.data.uses.value) {
			ui.notifications.warn("Trip Attack: No Superiority Die Remaining");
			return;
		} else {
			item.update({"data.uses.value" : item.data.data.uses.value - 1});
		}
		
		let canProne = tactorTarget.data.data.traits.size !== "grg" && tactorTarget.data.data.traits.size !== "huge";
		if (canProne) {
			const rollData = tactor.getRollData();
			const strDC = 8 + rollData.attributes.prof + rollData.abilities.str.mod;
			const dexDC = 8 + rollData.attributes.prof + rollData.abilities.dex.mod;
			const saveDC = strDC > dexDC ? strDC : dexDC;
            const itemData = {
				name: `Trip Attack Prone Save`,
				img: `systems/dnd5e/icons/skills/yellow_37.jpg`,
				type: "feat",
				data: {
					activation: { type: "none", },
					target: { type: "self", },
					actionType: "save",
					save: { dc: saveDC, ability: ability, scaling: "flat" },
				}
			}
			await USF.socket.executeAsGM("createItem", { actorUuid: tactorTarget.uuid, itemData: itemData });
			let saveItem = await tactorTarget.items.find(i => i.name === itemData.name);
			let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
			await USF.socket.executeAsGM("deleteItem", { itemUuid: saveItem.uuid });
			if (saveWorkflow.failedSaves.size) {
				const hasEffectApplied = await game.dfreds.effectInterface.hasEffectApplied("Prone", args[0].hitTargetUuids[0]);
                if (!hasEffectApplied) {
                    game.dfreds.effectInterface.addEffect({ effectName: "Prone", uuid: tactorTarget.uuid });
                }
            }
		} else {
			ui.notifications.warn("Trip Attack: Target too Large to be Knocked Prone");
		}
		
		const diceMult = args[0].isCritical ? 2: 1;
		const damageType = args[0].item.data.damage.parts[0][1];

		return {damageRoll: `${diceMult}${die}[${damageType}]`, flavor: "Trip Attack"};
	}
} catch(err) {
	console.error(`${args[0].itemData.name} - maneuver macro`, err);
}