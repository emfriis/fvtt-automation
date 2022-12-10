// hypnotic pattern

const lastArg = args[args.length - 1];
const target = await fromUuid(lastArg.actorUuid);
const tactor = target.actor ? target.actor : target;

if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0) {
    const resist = ["Fey Ancestry", "Duergar Reslience", "Charm Resilience"];
    for (let i = 0; i < lastArg.targetUuids.length; i++) {
        let tokenOrActorTarget = await fromUuid(lastArg.targetUuids[i]);
        let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
        let getResist = tactorTarget.items.find(i => resist.includes(i.name)) || tactorTarget.effects.find(i => resist.includes(i.data.label));
        if (getResist) {
            const effectData = {
                changes: [
                    {
                        key: "flags.midi-qol.advantage.ability.save.all",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        value: 1,
                        priority: 20,
                    }
                ],
                disabled: false,
                flags: { dae: { specialDuration: ["isSave"] } },
                icon: args[0].item.img,
                label: `${args[0].item.name} Save Advantage`,
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
        }
    }
}

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