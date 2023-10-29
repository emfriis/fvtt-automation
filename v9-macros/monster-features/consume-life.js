// consume life
// on use post save

const lastArg = args[args.length - 1];

if (args[0].tag === "OnUse" && lastArg.macroPass === "postSave") {
	for (let t = 0; t < lastArg.hitTargets.length; t++) {
		let target = lastArg.hitTargets[t];
		let tactor = target?.actor;
		if (!tactor) continue;
        if (lastArg.failedSaves.includes(target) && tactor.data.data.attributes.hp.value === 0 && !tactor.effects.find(e => e.data.label === "Dead")) {
            let effectData = {
                changes: [{ key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Dead", priority: 20, }],
                disabled: false,
                flags: { core: { overlay: true } },
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
            let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
            if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, lastArg.tokenId, "3d6", "healing", "magiceffect");
        }
    }
}