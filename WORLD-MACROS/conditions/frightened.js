// frightened world macro
// requires effect with frightened label that adds source actor uuid to flags.midi-qol.fear

if (!game.modules.get("midi-qol")?.active || !game.modules.get("conditional-visibility")?.active || !game.modules.get("levels")?.active || !_levels) throw new Error("requisite module(s) missing");

Hooks.on("midi-qol.preAttackRoll", async (workflow) => {
    if (!workflow?.token || !["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) return;
    if (!workflow.actor.effects.find(i => (i.data.label === "Frightened" && i.data.disabled === false))) return;
    await canvas.tokens.placeables.forEach(t => {
        if (t.actor && workflow.actor.data.flags["midi-qol"]?.fear?.includes(t.actor.uuid) && _levels?.advancedLosTestVisibility(workflow.token, t) && game.modules.get('conditional-visibility')?.api?.canSee(workflow.token, t)) {
            workflow.disadvantage = true;
            return;
        };
    });
});

Hooks.on("Actor5e.preRollAbilityTest", async (actor, rollData) => {
    const token = actor?.token ?? canvas.tokens.placeables.find(t => t.actor.uuid === actor.uuid);
    if (!token) return;
    await canvas.tokens.placeables.forEach(t => {
        if (t.actor && actor.data.flags["midi-qol"]?.fear?.includes(t.actor.uuid) && _levels?.advancedLosTestVisibility(token, t) && game.modules.get('conditional-visibility')?.api?.canSee(token, t)) {
            rollData.disadvantage = true;
            return;
        };
    });
});

Hooks.on("Actor5e.preRollSkill", async (actor, rollData) => {
    const token = actor?.token ?? canvas.tokens.placeables.find(t => t.actor.uuid === actor.uuid);
    if (!token) return;
    await canvas.tokens.placeables.forEach(t => {
        if (t.actor && actor.data.flags["midi-qol"]?.fear?.includes(t.actor.uuid) && _levels?.advancedLosTestVisibility(token, t) && game.modules.get('conditional-visibility')?.api?.canSee(token, t)) {
            rollData.disadvantage = true;
            return;
        };
    });
});