// blight
// on use pre save
// on use post damage

if (args[0].macroPass === "preSave") {
    for (let t = 0; t < args[0].targets.length; t++) {
		let target = args[0].targets[t];
		let tactor = target.actor;
		if (target.actor && target.actor.data.data.details?.type?.value?.toLowerCase()?.includes("plant")) {
			let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
				if (actor === tactor && abilityId === args[0].item.data.save.ability) {
					rollData.disadvantage = true;
					Hooks.off("Actor5e.preRollAbilitySave", hook);
				}
			});
		}
	}
}

if (args[0].macroPass === "postDamageRoll") {
    if (!args[0].targets.find(t => t.actor && t.actor.data.data.details?.type?.value?.toLowerCase()?.includes("plant"))) return;
    let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid); 
    let damageFormula = workflow.damageRoll.formula;
    let newDamageFormula = damageFormula.replace(/\d+d\d+/g, (i) => {
        let die = parseInt(i.match(/^(\d+)/));
        let faces = parseInt(i.match(/(\d+)+$/));
        return `${die * faces}`;
    });
    workflow.damageRoll = await new Roll(newDamageFormula).roll();
    workflow.damageTotal = workflow.damageRoll.total;
    workflow.damageRollHTML = await workflow.damageRoll.render();
}