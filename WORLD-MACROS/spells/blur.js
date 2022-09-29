// blur world macro

if (!game.modules.get("midi-qol")?.active || !game.modules.get("conditional-visibility")?.active || !game.modules.get("levels")?.active || !_levels || !game.modules.get("perfect-vision")?.active) throw new Error("requisite module(s) missing");

Hooks.on("midi-qol.preAttackRoll", async (workflow) => {
    if (!workflow?.token || !["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) return;
    Array.from(workflow?.targets).forEach(t => {
        if (!t?.actor || !t.actor.effects.find(i => i.data.label === "Blur")) return;
        const senses = workflow.actor.data.data.attributes.senses;
        const visRange = workflow.token.data.flags["perfect-vision"].sightLimit ? workflow.token.data.flags["perfect-vision"].sightLimit : 9999;
        const vision = Math.min(visRange, Math.max(senses.blindsight, senses.tremorsense, senses.truesight, 0));
        const dist = MidiQOL.getDistance(workflow.token, t, false);
        let ignore = vision >= dist && game.modules.get('conditional-visibility')?.api?.canSee(workflow.token, t) && _levels?.advancedLosTestVisibility(workflow.token, t);
        if (ignore) return;
        workflow.disadvantage = true;
    });
});