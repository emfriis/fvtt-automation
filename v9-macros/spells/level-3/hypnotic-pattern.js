// hypnotic pattern
// on use pre saves
// effect itemacro

const lastArg = args[args.length - 1];
const target = await fromUuid(lastArg.actorUuid);
const tactor = target.actor ? target.actor : target;

if (args[0] === "on" && !lastArg.efData.disabled) {
    let effect = await tactor.effects.find(i => i.data === lastArg.efData);
    if (effect) {
        const effectData = {
            changes: [{ key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Incapacitated", priority: 20, }],
            disabled: false,
            label: "Incapacitated",
            flags: {
                hypnoticPattern: true,
            },
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
        const incapacitated = tactor.effects.find(e => e.data.flags.hypnoticPattern);
        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: effect.id, changes: [{ key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: incapacitated.uuid, priority: 20 }].concat(effect.data.changes) }] });
    }
}