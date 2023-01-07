// improved abjuration
// effect on use pre effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.macroPass === "preActiveEffects" && lastArg.item.type === "spell" && (lastArg.item.name.toLowerCase().includes("counterspell") || lastArg.item.name.toLowerCase().includes("dispel magic"))) {
	const effectData = {
        changes: [{ key: `flags.midi-qol.advantage.ability.check.int`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
        disabled: false,
        label: "Improved Abjuration Advantage",
        duration: { seconds: 1, startTime: game.time.worldTime },
        flags: { dae: { specialDuration: ["isCheck.int"] } },
    };
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
}