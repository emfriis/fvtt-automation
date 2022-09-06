// tasha's mind whip

const lastArg = args[args.length - 1];

if (args[0] === "off" && lastArg.tokenId === game.combat?.current.tokenId && lastArg["expiry-reason"] !== "times-up:turn-start-end") {
	const tokenOrActor = await fromUuid(lastArg.actorUuid);
	const tokenActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    const hasEffectApplied = await game.dfreds.effectInterface.hasEffectApplied("Incapacitated", lastArg.actorUuid );
	if (!hasEffectApplied) {
        let effectData = {
                        label: "Incapacitated",
                        icon: "icons/magic/control/debuff-energy-hold-pink.webp",
                        origin: lastArg.uuid,
                        duration: {turns: 1, startTime: game.time.worldTime}, 
                        disabled: false,
                        changes: [{ key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Incapacitated" }, { key: `data.attributes.movement.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "0" }]
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tokenActor.uuid, effects: [effectData] });
    }
}