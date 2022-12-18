// stunning strike
// damage bonus

try {

	if (args[0].tag !== "DamageBonus" || args[0].itemData.data.actionType !== "mwak" || args[0].hitTargets.length === 0) return;
	const tokenOrActor = await fromUuid(args[0].tokenUuid);
	const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
	const tokenOrActorTarget = await fromUuid(args[0].hitTargetUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
	const dc = 8 + tactor.data.data.attributes.prof + tactor.data.data.abilities.wis.mod;
    let item = tactor.items.find(i => i.name === "Ki");
	
	if (dc && item && item.data.data.uses.value) {
		let dialog = new Promise((resolve, reject) => {
			new Dialog({
			title: "Stunning Strike: Usage Configuration",
			content: `
			<form id="use-form">
				<p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Stunning Strike", type: "feature"}) + `</p>
				<p>Use a Ki Point to use Stunning Strike?</p>
				<p>(` + item.data.data.uses.value + ` Ki Remaining)</p>
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
		stun = await dialog;
		if (!stun) return;
		
		if (!item || !item.data.data.uses.value) {
			return ui.notifications.warn("Stunning Strike: No Ki Remaining");
		} else {
			item.update({"data.uses.value" : item.data.data.uses.value - 1});
		}
		
        const getResist = tactorTarget.data.flags["midi-qol"]?.resilience?.stunned;
        const rollOptions = getResist ? { request: "save", targetUuid: tactorTarget.uuid, ability: ability, advantage: true } : { request: "save", targetUuid: tactorTarget.uuid, ability: "con" };
        let roll = await MidiQOL.socket().executeAsGM("rollAbility", rollOptions);
        if (game.dice3d) game.dice3d.showForRoll(roll);
        if (roll.total < dc) {
            game.dfreds.effectInterface.addEffect({ effectName: "Stunned", uuid: tactorTarget.uuid });
        }
	}
} catch(err) {
	console.error(`${args[0].itemData.name} - stunnings strike macro`, err);
}