// arms of hadar
// on use post saves

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