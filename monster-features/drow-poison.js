// drow-poison
// on use pre saves
// on use post saves

const lastArg = args[args.length - 1];

// poison save advantage check

if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0 && args[0].macroPass === "preSave") {
    const resist = ["Dwarven Resilience", "Duergar Resilience", "Stout Resilience", "Poison Resilience"];
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
        };
    };
};

// paralysis fail check

if (args[0].tag === "OnUse" && lastArg.failedSaves.length > 0 && args[0].macroPass === "postActiveEffects") {
    const workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    for (let i = 0; i < workflow.saveDisplayData.length; i++) {
        let tactorTarget = workflow.saveDisplayData[i]?.target?.actor ? workflow.saveDisplayData[i]?.target?.actor : workflow.saveDisplayData[i]?.target;
        let critFail = workflow.saveDisplayData[i]?.rollTotal < 9;
        if (critFail) {
            let effect = tactorTarget.effects.find(i => i.data.origin === args[0].uuid);
            if (effect && !tactorTarget.data.data.traits.ci?.value.includes("poisoned")) {
                let effectData = {
                    changes: [{ key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Unconscious", priority: 20 }],
                    disabled: false,
                    duration: { seconds: 3600, startTime: game.time.worldTime },
                    flags: { dae: { specialDuration: ["isDamaged"] } },
                    icon: args[0].item.img,
                    label: `${args[0].item.name} Poison`,
                };
                let parEf = await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
                effect.update({ changes: [{
                    key: "flags.dae.deleteUuid",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    priority: 20,
                    value: parEf[0].uuid,
                }].concat(effect.data.changes) });
            };
        };
    };
};