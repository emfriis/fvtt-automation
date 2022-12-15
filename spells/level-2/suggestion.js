// suggestion

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && args[0].failedSaveUuids.length > 0) {

	const tokenOrActorTarget = await fromUuid(lastArg.failedSaveUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
    if (!tactorTarget) MidiQOL.error("No target for Suggestion found");

	let dialog = new Promise((resolve, reject) => {
		new Dialog({
		title: "Suggestion: Usage Configuration",
		content: `
		<form id="suggestion-use-form">
			<p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Suggestion", type: "feature"}) + `</p>
			<p>Choose a suggestion.</p>
			<form>
				<input id="suggestion" type="text" 
				pattern="^[a-zA-Z]+$"/>
			</form>
		</form>
		`,
		buttons: {
			one: {
				icon: '<i class="fas fa-check"></i>',
				label: "Confirm",
				callback: () => resolve(document.getElementById('suggestion').value)
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
	suggestion = await dialog;
	
	const effect = await tactorTarget.effects.find(i => i.data.label === "Suggestion" && i.parent === tactor);
    const changes = [
        { key: "flags.midi-qol.suggestion", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: suggestion, priority: 20 },
        { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "", priority: 20 },
    ];
	if (effect) {
        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: effect.id, changes: changes.concat(effect.data.changes) }] });
    }
}

if (args[0] === "each") {
	let suggestion = getProperty(tactor.data.flags, "midi-qol.suggestion");
	new Dialog({
		title: "Suggestion",
		content: `
		<form id="suggestion-form">
			<p>
                You are magically compelled to follow the suggestion: <br>
                "${suggestion}"
            </p>
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