// charm person
// on use pre saves

const lastArg = args[args.length - 1];

if (args[0].tag === "OnUse") {
	let token = canvas.tokens.get(lastArg.tokenId);
	for (let t = 0; t < lastArg.targets.length; t++) {
		let target = lastArg.targets[t];
		let tactor = target?.actor;
		if (game.combat && target.data.disposition !== token.data.disposition && target.data.disposition !== 0) {
			let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
				if (actor === tactor && abilityId === lastArg.item.data.save.ability) {
					rollData.advantage = true;
					Hooks.off("Actor5e.preRollAbilitySave", hook);
				}
			});
		}
	}
}