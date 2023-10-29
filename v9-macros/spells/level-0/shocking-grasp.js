// shocking grasp
// on use pre attack
// on use post effects

const lastArg = args[args.length - 1];

if (args[0].tag === "OnUse" && lastArg.macroPass === "preAttackRoll") {
	for (let t = 0; t < lastArg.targets.length; t++) {
		let target = lastArg.targets[t];
		let tactor = target?.actor;
		if (!tactor) continue;
		let isMetal = tactor.items.find(i => i.type == "equipment" && i.data.data.equipped && (i.data.data.armor.type == "heavy" || i.data.data.armor.type == "medium") && !i.name.toLowerCase().includes("hide"));
		if (isMetal) {
			const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    		attackWorkflow.advantage = true;
		}
	}
}

if (args[0].tag === "OnUse" && lastArg.macroPass === "postActiveEffects") {
	for (let t = 0; t < lastArg.targets.length; t++) {
		let target = lastArg.targets[t];
		let tactor = target?.actor;
		if (!tactor) continue;
		if (!tactor.effects.find(e => e.data.label === "Reaction") && game.combat) {
			game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: tactor.uuid });
		}
	}
}