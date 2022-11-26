// incapacitated world macro

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

Hooks.on("midi-qol.preCheckSaves", async (workflow) => {
    try {
        if (!workflow?.actor || !["action", "bonus"].includes(workflow.item.data.data.activation.type)) return;
        if (workflow.actor.effects.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.data.label))) {
            ui.notifications.warn(`${tactor.name} is Incapaciated`);
            return false;
        }
    } catch(err) {
        console.error(`incapacitated macro error`, err);
    }
});