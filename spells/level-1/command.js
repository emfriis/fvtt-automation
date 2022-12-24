// command
// on use post saves

const lastArg = args[args.length - 1];

if (args[0].tag === "OnUse" && args[0].failedSaveUuids.length > 0) {

	const tokenOrActorTarget = await fromUuid(lastArg.failedSaveUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
    if (!tactorTarget) return;
	if (tactorTarget.data.data.details?.type?.value?.toLowerCase()?.includes("undead")) return ui.notifications.warn("Target for Command is invalid");

	let dialog = new Promise((resolve, reject) => {
		new Dialog({
		title: "Command: Usage Configuration",
		content: `
		<form id="command-use-form">
			<p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Command", type: "feature"}) + `</p>
			<p>Choose a command word.</p>
			<form>
				<input id="command" type="text" 
				pattern="^[a-zA-Z]+$"/>
			</form>
		</form>
		`,
		buttons: {
			one: {
				icon: '<i class="fas fa-check"></i>',
				label: "Command",
				callback: () => resolve(document.getElementById('command').value)
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
	commandWord = await dialog;
	
	const item = await fromUuid(lastArg.uuid);
	const effectData = {
		changes: [
			{ key: "flags.midi-qol.commandWord", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: commandWord, priority: 20 },
			{ key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "", priority: 20 },
		],
		disabled: false,
		flags: { dae: { itemData: item.data, specialDuration: ["turnEnd"], macroRepeat: "startEveryTurn" }, core: { statusId: "Command" } },
		icon: lastArg.item.img,
		label: `${lastArg.item.name}`,
	};
	await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
}

if (args[0] === "each") {
	const tokenOrActor = await fromUuid(lastArg.actorUuid);
	const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
	let commandWord = getProperty(tactor.data.flags, "midi-qol.commandWord");
	new Dialog({
		title: "Command",
		content: `
		<form id="command-form">
			<p>You are magically compelled to ${commandWord}.</p>
		</form>
		`,
		buttons: {
			one: {
				icon: '<i class="fas fa-check"></i>',
				label: "Ok",
			},
		},
		default: "one",
	}).render(true);
}