// maneuvering attack
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
			title: "Maneuvering Attack: Usage Configuration",
			content: `
			<form id="use-form">
				<p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Maneuvers: Maneuvering Attack", type: "feature"}) + `</p>
				<p>Use a Superiority Die to use Disarming Attack?</p>
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
			ui.notifications.warn("Maneuvering Attack: No Superiority Die Remaining");
			return;
		} else {
			item.update({"data.uses.value" : item.data.data.uses.value - 1});
		}
		
		ChatMessage.create({ content: "A nearby ally can use its reaction to move up to half its speed without provoking opportunity attacks from the target." });
		
		const diceMult = args[0].isCritical ? 2: 1;
		const damageType = args[0].item.data.damage.parts[0][1];

		return {damageRoll: `${diceMult}${die}[${damageType}]`, flavor: "Maneuvering Attack"};
	}
} catch(err) {
	console.error(`${args[0].itemData.name} - maneuver macro`, err);
}