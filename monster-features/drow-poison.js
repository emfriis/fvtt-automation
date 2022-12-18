// drow-poison
// on use post saves

const lastArg = args[args.length - 1];

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
                    origin: args[0].uuid,
                };
                let effect = await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
                let changes = [{ key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 20, value: effect.uuid, }];
                if (effect && changes) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactorTarget.uuid, updates: [{ _id: effect.id, changes: changes.concat(effect.data.changes) }] });
            };
        };
    };
};