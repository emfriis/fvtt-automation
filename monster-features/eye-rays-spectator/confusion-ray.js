const lastArg = args[args.length - 1];

if (args[0].tag == "OnUse") {
	if (lastArg.failedSaveUuids.length > 0) {
        for (let i = 0; i < lastArg.failedSaveUuids.length > 0; i++) {
            let targetUuid = lastArg.failedSaveUuids[i];
            let targetToken = await fromUuid(targetUuid);
            let targetActor = targetToken.actor ?? targetToken._actor;
            const hasEffectApplied = await game.dfreds.effectInterface.hasEffectApplied("Reaction", targetUuid );
            if (!hasEffectApplied) {
                game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: targetActor.uuid });
            }
        }
	}
}

if (args[0] === "each" && lastArg.efData.disabled === false) {
	new Dialog({
		title: "Confusion Ray",
		content: `
		<form id="confusion-form">
			<p>In your confusion, you must use your turn to attack a random creature.</p>
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