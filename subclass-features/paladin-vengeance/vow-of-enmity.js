// vow of enmity
// on use
// effect on use pre attack

if (args[0].macroPass === "postActiveEffects" && args[0].hitTargets.length === 1) {
    let token = args[0].hitTargets[0];
    let tactor = token.actor;
    if (!tactor) return;

    let effect = tactor.effects.find(e => e.data.label === "Vow of Enmity" && e.data.origin === args[0].uuid);
    if (!effect) return;

    let effectData = [{
        changes: [
            { key: `flags.midi-qol.onUseMacroName`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.Channel Divinity: Vow of Enmity, preAttackRoll`, priority: 20 },
            { key: `flags.midi-qol.vowOfEnmity`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `+${token.id}`, priority: 20 },
            { key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: effect.uuid, priority: 20 },
        ],
        disabled: false,
        label: "Vow of Enmity Advantage",
        icon: "icons/magic/symbols/runes-triangle-orange.webp",
        origin: args[0].uuid,
        duration: { seconds: 60, startTime: game.time.worldTime },
    }];
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actorUuid, effects: effectData });
}

if (args[0].macroPass === "preAttackRoll" && args[0].targets.find(t => args[0].actorData.flags["midi-qol"].vowOfEnmity.includes(t.id))) {
    const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    attackWorkflow.advantage = true;
}