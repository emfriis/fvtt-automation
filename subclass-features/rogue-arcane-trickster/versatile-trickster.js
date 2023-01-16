// versatile trickster
// on use
// effect on use pre attack

if (args[0].tag === "OnUse" && args[0].macroPass !== "preAttackRoll" && args[0].targets.length === 1) {
    let token = args[0].targets[0];
    let tactor = token.actor;
    if (!tactor) return;

    let nearbyHand = canvas.tokens.placeables.find(p => 
        p.actor &&
        p.name.includes("Mage Hand") &&
        p.name.includes(args[0].actor.name) &&
        MidiQOL.getDistance(p, token, false) <= 5
    );
    if (!nearbyHand) return ui.notifications.warn("Mage Hand isn't within 5 feet of the target");

    let effectData1 = [{
        changes: [
            { key: `flags.midi-qol.onUseMacroName`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.Versatile Trickster, preAttackRoll`, priority: 20 },
            { key: `flags.midi-qol.versatileTrickster`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `+${token.id}`, priority: 20 },
        ],
        disabled: false,
        label: "Versatile Trickster Advantage",
        icon: "icons/skills/melee/sword-damaged-broken-purple.webp",
        origin: args[0].uuid,
        flags: { dae: { specialDuration: ["turnEndSource"], stackable: "noneName" }, core: { statusId: "Versatile Trickster Advantage" } },
    }];
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actorUuid, effects: effectData1 });

    let effectData2 = [{
        disabled: false,
        label: "Versatile Trickster Mark",
        icon: "icons/skills/melee/sword-damaged-broken-purple.webp",
        origin: args[0].uuid,
        flags: { dae: { specialDuration: ["turnEndSource"] }, core: { statusId: "Versatile Trickster Mark" } },
    }];
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: effectData2 });
}

if (args[0].macroPass === "preAttackRoll" && args[0].targets.find(t => args[0].actorData.flags["midi-qol"].versatileTrickster.includes(t.id))) {
    const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    attackWorkflow.advantage = true;
}