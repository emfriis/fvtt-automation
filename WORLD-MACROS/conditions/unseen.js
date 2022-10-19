// unseen world macro

if (!game.modules.get("midi-qol")?.active || !game.modules.get("conditional-visibility")?.active || !game.modules.get("levels")?.active || !_levels) throw new Error("requisite module(s) missing");

Hooks.on("midi-qol.preAttackRoll", async (workflow) => {
    if (!workflow?.token || !["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType) || workflow.targets.size === 0) return;
    let hasAdv, hasDisadv;
    workflow.targets.forEach(target => {
        if (!hasDisadv && (!game.modules.get('conditional-visibility')?.api?.canSee(workflow.token, target) || !_levels?.advancedLosTestVisibility(workflow.token, target))) {
            workflow.disadvantage = true;
            hasDisadv = true;
        };
        if (!hasAdv && (!game.modules.get('conditional-visibility')?.api?.canSee(target, workflow.token) || !_levels?.advancedLosTestVisibility(target, workflow.token))) {
            workflow.advantage = true;
            hasAdv = true;
        };
    });
});