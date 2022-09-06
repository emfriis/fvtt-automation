// shocking grasp

const lastArg = args[args.length - 1];

if (args[0].tag == "OnUse") {
	if (lastArg.hitTargetUuids.length > 0) {
		let targetUuid = lastArg.hitTargetUuids[0];
		let targetToken = await fromUuid(targetUuid);
		let targetActor = targetToken.actor ?? targetToken._actor;
		const hasEffectApplied = await game.dfreds.effectInterface.hasEffectApplied("Reaction", targetUuid );
		if (!hasEffectApplied) {
			game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: targetActor.uuid });
		}
	}
}