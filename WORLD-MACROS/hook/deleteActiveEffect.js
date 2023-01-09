// deleteActiveEffect

Hooks.on("deleteActiveEffect", async (effect) => {
    try {

        const tactor = effect.parent;
        if (!tactor) return;

        // disable effect on incapacitated
        if (["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(effect.data.label) && !tactor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(e.data.label)) && tactor.effects.find(e => e.data.disabled && e.data.changes.find(c => c.key === "midi-qol.disable.incapacitated"))) {
            try {
                console.warn("Disable Effect on Incapacitated activated");
                const disableIds = tactor.effects.filter(e => e.data.disabled && e.data.changes.find(c => c.key === "midi-qol.disable.incapacitated")).map(e => e.id);
                for (let i = 0; i < disableIds.length; i++) {
                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: i, disabled: false }] });
                }
                console.warn("Disable Effect on Incapacitated used");
            } catch (err) {
                console.error("Disable Effect on Incapacitated error", err);
            }
        }
        
    } catch(err) {
        console.error("deleteActiveEffect Error", err);
    }
});