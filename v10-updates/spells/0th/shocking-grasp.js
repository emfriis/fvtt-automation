try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "preAttackRoll" || !args[0].targets[0].actor.items.find(i => i.type === "equipment" && i.system.equipped && (i.system.armor.type === "heavy" || i.system.armor.type === "medium") && !i.name.toLowerCase().includes("hide"))) return;
    const workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    workflow.advantage = true;
} catch (err) {console.error("Shocking Grasp Macro - ", err)}