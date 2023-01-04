// menacing attack
// damage bonus macro

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

try {

	if (args[0].tag !== "DamageBonus" || !["mwak", "rwak"].includes(args[0].itemData.data.actionType)|| args[0].hitTargetUuids.length < 1) return {};
	const tokenOrActorTarget = await fromUuid(args[0].hitTargetUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
	const die = tactor.data.data.scale["battle-master"]["combat-superiority-die"];
    let item = tactor.items.find(i => i.name === "Combat Superiority");
	
	if (die && item && item.data.data.uses.value) {
		let dialog = new Promise((resolve, reject) => {
			new Dialog({
			title: "Menacing Attack: Usage Configuration",
			content: `
			<form id="use-form">
				<p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Maneuvers: Menacing Attack", type: "feature"}) + `</p>
				<p>Use a Superiority Die to use Menacing Attack?</p>
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
			await item.update({ "data.uses.value" : Math.max(0, item.data.data.uses.value - 1) });
		}
		
        const rollData = tactor.getRollData();
        const strDC = 8 + rollData.attributes.prof + rollData.abilities.str.mod;
        const dexDC = 8 + rollData.attributes.prof + rollData.abilities.dex.mod;
        const saveDC = strDC > dexDC ? strDC : dexDC;
        const ability = "wis";
        const save = await USF.socket.executeAsGM("attemptSaveDC", { actorUuid: tactorTarget.uuid, saveName: `Menacing Attack Frightened Save`, saveImg: `systems/dnd5e/icons/skills/yellow_37.jpg`, saveType: "save", saveDC: saveDC, saveAbility: ability });
    	if (!save) {
            let effectData = [{
                changes: [{ key: `flags.midi-qol.fear`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `+${lastArg.tokenId}`, priority: 20 }],
                origin: args[0].uuid,
                flags: { "dae": { specialDuration: ["turnEndSource"] }, "core": { statusId: "Frightened" } },
                disabled: false,
                icon: "icons/svg/terror.svg",
                label: "Frightened"
            }];
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: effectData });
        }
		
		const diceMult = args[0].isCritical ? 2: 1;
		const damageType = args[0].item.data.damage.parts[0][1];
		
		return {damageRoll: `${diceMult}${die}[${damageType}]`, flavor: "Menacing Attack"};
	}
} catch(err) {
	console.error(`${args[0].itemData.name} - maneuver macro`, err);
}