// drow-poison
// on use post effects

const lastArg = args[args.length - 1];

// paralysis fail check

if (args[0].tag === "OnUse" && lastArg.failedSaves.length > 0 && lastArg.macroPass === "postActiveEffects") {
    const workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    for (let i = 0; i < workflow.saveDisplayData.length; i++) {
        let tactorTarget = workflow.saveDisplayData[i]?.target?.actor ? workflow.saveDisplayData[i]?.target?.actor : workflow.saveDisplayData[i]?.target;
        let critFail = workflow.saveDisplayData[i]?.rollTotal < 9;
        if (critFail) {
            let effect1 = tactorTarget.effects.find(i => i.data.label === "Poisoned" && i.data.origin === lastArg.uuid);
            if (effect1 && !tactorTarget.data.data.traits.ci?.value.includes("poisoned")) {
                let effectData = {
                    changes: [{ key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Unconscious", priority: 20 }],
                    disabled: false,
                    duration: { seconds: 3600, startTime: game.time.worldTime },
                    flags: { dae: { specialDuration: ["isDamaged"] } },
                    icon: args[0].item.img,
                    label: `${args[0].item.name} Poison`,
                    origin: args[0].uuid,
                };
                let effect2 = await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
                let changes = [{ key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: effect.uuid, priority: 20 }];
                if (effect2 && changes) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactorTarget.uuid, updates: [{ _id: effect1.id, changes: changes.concat(effect1.data.changes) }] });
            };
        };
    };
};