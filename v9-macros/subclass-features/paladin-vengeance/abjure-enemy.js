// abjure enemy
// on use pre save
// on use post effects

if (args[0].macroPass === "preSave" && args[0].hitTargets.length === 1) {
    let token = args[0].hitTargets[0];
    let tactor = token.actor;
    if (!tactor || !["fiend","undead"].includes(tactor.data.data.details?.type?.value?.toLowerCase() ?? tactor.data.data.details?.race?.toLowerCase())) return;

    let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
        if (actor === tactor && abilityId === args[0].item.data.save.ability) {
            rollData.disadvantage = true;
            Hooks.off("Actor5e.preRollAbilitySave", hook);
        }
    });
}

if (args[0].macroPass === "postActiveEffects" && args[0].hitTargets.length === 1 && !args[0].failedSaves.includes(args[0].hitTargets[0])) {
    let token = args[0].hitTargets[0];
    let tactor = token.actor;
    if (!tactor) return;

    let effectData = [{
        changes: [{ key: `data.attributes.movement.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `/2`, priority: 20 }],
        disabled: false,
        label: "Abjure Enemy",
        icon: "icons/magic/death/skeleton-bird-skull-gray.webp",
        origin: args[0].uuid,
        flags: { dae: { specialDuration: ["isDamaged"] } },
        duration: { seconds: 60, startTime: game.time.worldTime },
    }];
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: effectData });
}