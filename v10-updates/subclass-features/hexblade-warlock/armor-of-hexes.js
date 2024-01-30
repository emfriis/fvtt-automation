try {
    if (args[0].macroPass != "postActiveEffects") return;
    if (args[0].damageRoll.total > 3) {
        const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].workflowOptions.sourceItemUuid);
        ChatMessage.create({ content: `The attack is deflected by ${args[0].actor.name}'s Armor of Hexes.` });
        attackWorkflow.targets = new Set();
        let hook = Hooks.on("midi-qol.AttackRollComplete", async (workflowNext) => {
            if (workflowNext.uuid == attackWorkflow.uuid) {
                attackWorkflow.targets = new Set();
                attackWorkflow.hitTargets = new Set();
                Hooks.off("midi-qol.AttackRollComplete", hook);
            }
        });
    }
} catch (err) {console.error("Armor of Hexes Macro - ", err)}