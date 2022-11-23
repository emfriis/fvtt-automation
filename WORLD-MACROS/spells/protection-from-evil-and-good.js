// protection from evil and good world macro

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

Hooks.on("midi-qol.preAttackRoll", async (workflow) => {
    try {
        if (!workflow?.actor || !workflow?.token || !["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) return;
        const types = ["aberration", "celestial", "elemental", "fey", "fiends", "undead"];
        if (!types.some(type => (workflow.actor.data.data.details?.type?.value || "").toLowerCase().includes(type) || (workflow.actor.data.data.details?.race || "").toLowerCase().includes(type))) return;
        workflow?.targets.forEach(async (t) => {
            if (!t?.actor || !t.actor.effects.find(i => i.data.label === "Protection from Evil and Good")) return;
            workflow.disadvantage = true;
        });
    } catch(err) {
        console.error(`protection from good and evil macro error`, err);
    }
});