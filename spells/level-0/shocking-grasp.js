// shocking grasp WIP

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
			const effectData = {
				changes: [
					{
						key: "flags.midi-qol.advantage.attack.msak",
						mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
						value: 1,
						priority: 20,
					}
				],
				disabled: false,
				flags: { dae: { specialDuration: ["1Attack"] } },
				icon: args[0].item.img,
				label: `${args[0].item.name} Advantage`,
			};
			await tactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
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