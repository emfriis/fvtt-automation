// shocking grasp
// on use pre attack
// on use post effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.macroPass === "preAttackRoll") {
	if (lastArg.targetUuids.length > 0) {
		let targetUuid = lastArg.targetUuids[0];
		let tokenOrActorTarget = await fromUuid(targetUuid);
		let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
		let isMetal = tactorTarget.items.find(i => i.type == "equipment" && i.data.data.equipped && (i.data.data.armor.type == "heavy" || i.data.data.armor.type == "medium") && !i.data.name.toLowerCase().includes("hide"));
		if (isMetal) {
			const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    		attackWorkflow.advantage = true;
		}
	}
}

if (args[0].tag === "OnUse" && lastArg.macroPass === "postActiveEffects") {
	if (lastArg.hitTargetUuids.length > 0) {
		let targetUuid = lastArg.hitTargetUuids[0];
		let tokenOrActorTarget = await fromUuid(targetUuid);
		let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
		const hasEffectApplied = await game.dfreds.effectInterface.hasEffectApplied("Reaction", targetUuid );
		if (!hasEffectApplied) {
			game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: tactorTarget.uuid });
		}
	}
}