// mirror image world macro
// mirror image spell should add 3 effects with the label "Mirror Image"

if (!game.modules.get("midi-qol")?.active || !game.modules.get("conditional-visibility")?.active || !game.modules.get("levels")?.active || !_levels || !game.modules.get("perfect-vision")?.active) throw new Error("requisite module(s) missing");

Hooks.on("midi-qol.preCheckHits", async (workflow) => {
    if (!workflow?.token || !["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) return;
    workflow?.targets.forEach(async (t) => {
        if (!t?.actor || !t.actor.effects.find(i => i.data.label === "Mirror Image")) return;
        const senses = workflow.actor.data.data.attributes.senses;
        const visRange = workflow.token.data.flags["perfect-vision"].sightLimit ? workflow.token.data.flags["perfect-vision"].sightLimit : 9999;
        const vision = Math.min(visRange, Math.max(senses.blindsight, senses.tremorsense, senses.truesight, 0));
        const dist = MidiQOL.getDistance(workflow.token, t, false);
        let ignore = vision >= dist && game.modules.get('conditional-visibility')?.api?.canSee(workflow.token, t) && _levels?.advancedLosTestVisibility(workflow.token, t);
        if (ignore) return;
        let mirrorImage = t.actor.effects.filter(i => i.data.label === "Mirror Image").length;
		let miDC = mirrorImage == 3 ? 6 : mirrorImage == 2 ? 8 : mirrorImage == 1 ? 11 : null;
		let miAC = 10 + t.actor.data.data.abilities.dex.mod;
        const roll = new Roll(`1d20`).evaluate({ async: false });
        if (game.dice3d) game.dice3d.showForRoll(roll);
        if (roll.total >= miDC) {
            if (!getProperty(workflow, "item.data.flags.midi-qol.noProvokeReaction")) {
                setProperty(workflow, "item.data.flags.midi-qol.noProvokeReaction", true);
                Hooks.once("midi-qol.RollComplete", nextWorkflow => {
                    if (workflow.uuid === nextWorkflow.uuid) {
                        setProperty(nextWorkflow, "item.data.flags.midi-qol.noProvokeReaction", false);
                    }
                });
            };
            Hooks.once("midi-qol.preDamageRoll", nextWorkflow => {
                if (workflow.uuid === nextWorkflow.uuid) {
                    workflow?.hitTargets.delete(t);
                };
            });
            if (workflow.attackRoll.total >= miAC) {
                let effect = t.actor.effects.find(i => i.data.label === "Mirror Image");
                t.actor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
            };
        };
    });
});