// deleteActiveEffect

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

Hooks.on("deleteActiveEffect", async (effect) => {
    try {

        const tactor = effect.parent;
        if (!tactor) return;

        // disable effect on incapacitated revert
        if (["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(effect.data.label) && !tactor.effects.find(e => !e.data.disabled && ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(e.data.label)) && tactor.effects.find(e => e.data.disabled && e.data.changes.find(c => c.key === "flags.midi-qol.disable.effect.incapacitated"))) {
            try {
                console.warn("Disable Effect on Incapacitated Revert activated");
                const disableIds = tactor.effects.filter(e => e.data.disabled && e.data.changes.find(c => c.key === "flags.midi-qol.disable.effect.incapacitated")).map(e => e.id);
                for (let i = 0; i < disableIds.length; i++) {
                    await wait(100);
                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: disableIds[i], disabled: false }] });
                }
                console.warn("Disable Effect on Incapacitated Revert used");
            } catch (err) {
                console.error("Disable Effect on Incapacitated Revert error", err);
            }
        }
        
    } catch(err) {
        console.error("deleteActiveEffect Error", err);
    }
});