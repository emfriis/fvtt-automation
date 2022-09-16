// command

if (args[0].tag === "OnUse" && args[0].failedSaves.length > 0) {

	let target = canvas.tokens.get(args[0].hitTargets[0].id ?? args[0].hitTargets[0]._id);
    if (!target) MidiQOL.error("No target for Command found");
	let targetActor = args[0].hitTargets[0].actor ?? args[0].hitTargets[0]._actor;

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
	
	const effectData = {
		changes: [
			{
				key: "flags.midi-qol.CommandWord",
				mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
				value: commandWord,
				priority: 20,
			}
		],
		disabled: false,
		duration: { rounds: 1, turns: 1, startTime: game.time.worldTime },
		flags: { dae: { specialDuration: ["turnEnd"] } },
		icon: args[0].item.img,
		label: `${args[0].item.name}`,
	};
	await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [effectData] });
}