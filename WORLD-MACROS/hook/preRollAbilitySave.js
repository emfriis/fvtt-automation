// preRollAbilitySave

Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
    try {
        // danger sense
        if (abilityId === "dex" && !rollData.advantage && actor.data.flags["midi-qol"].dangerSense && !actor.effects.find(e => ["Blinded", "Deafened", "Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(e.data.label))) {
            try {
                console.warn("Danger Sense activated");
                rollData.advantage = true;
                console.warn("Danger Sense used");
            } catch(err) {
                console.error("Danger Sense error", err);
            }
        }
    } catch (err) {
        console.error("preRollAbilitySave error", err);
    }
});