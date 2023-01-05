// giant spider bite
// on use pre saves
// on use post saves

const lastArg = args[args.length - 1];

// poisoned condition application check

if (args[0].tag === "OnUse" && lastArg.failedSaveUuids.length > 0 && args[0].macroPass === "postActiveEffects") {
    for (let i = 0; i < lastArg.failedSaveUuids.length; i++) {
        let tokenOrActorTarget = await fromUuid(lastArg.failedSaveUuids[i]);
        let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
        if (!tactorTarget.data.data.traits.di?.value.includes("poison") && !tactorTarget.data.data.traits.ci?.value.includes("poisoned") && tactorTarget.data.data.attributes.hp.value < 1) {
            const effectData = {
                changes: [
                    { key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Poisoned", priority: 20 },
                    { key: `macro.CE`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Paralyzed", priority: 20 },
                ],
                disabled: false,
                duration: { seconds: 3600, startTime: game.time.worldTime },
                icon: args[0].item.img,
                label: `${args[0].item.name} Poison`,
                origin: args[0].uuid,
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
        }
    }
}