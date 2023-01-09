// updateActiveEffect

Hooks.on("updateActiveEffect", async (effect) => {
    try {

        const tactor = effect.parent;
        if (!tactor) return;

        // downed
        if (["Dead", "Defeated", "Unconscious"].includes(effect.data.label) && !effect.data.disabled) {
            try {
                console.warn("Downed activated");
                if (!tactor.effects.find(e => e.data.label === "Prone")) await game.dfreds.effectInterface.addEffect({ effectName: "Prone", uuid: tactor.uuid });
                if (tactor.data.flags["midi-qol"]?.rage && tactor.effects.find(e => e.data.label === "Rage")) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [tactor.effects.find(e => e.data.label === "Rage").id] });
                console.warn("Downed used");
            } catch (err) {
                console.error("Downed error", err);
            }
        }

        // delete effect on incapacitated
        if (["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(effect.data.label) && !effect.data.disabled && tactor.data.flags["midi-qol"]?.delete?.incapacitated) {
            try {
                console.warn("Delete Effect on Incapacitated activated");
                const deleteIds = tactor.effects.filter(e => e.data.changes.find(c => c.key === "midi-qol.delete.incapacitated")).map(e => e.id);
                if (deleteIds) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: deleteIds });
                console.warn("Delete Effect on Incapacitated used");
            } catch (err) {
                console.error("Delete Effect on Incapacitated error", err);
            }
        }

        // disable effect on incapacitated
        if (["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(effect.data.label) && !effect.data.disabled && tactor.data.flags["midi-qol"]?.disable?.incapacitated) {
            try {
                console.warn("Disable Effect on Incapacitated activated");
                const disableIds = tactor.effects.filter(e => !e.data.disabled && e.data.changes.find(c => c.key === "flags.midi-qol.disable.incapacitated")).map(e => e.id);
                for (let i = 0; i < disableIds.length; i++) {
                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: disableIds[i], disabled: true }] });
                }
                console.warn("Disable Effect on Incapacitated used");
            } catch (err) {
                console.error("Disable Effect on Incapacitated error", err);
            }
        }

        // disable effect on incapacitated revert
        if (["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(effect.data.label) && effect.data.disabled && !tactor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(e.data.label)) && tactor.effects.find(e => e.data.disabled && e.data.changes.find(c => c.key === "flags.midi-qol.disable.incapacitated"))) {
            try {
                console.warn("Disable Effect on Incapacitated Revert activated");
                const disableIds = tactor.effects.filter(e => e.data.disabled && e.data.changes.find(c => c.key === "flags.midi-qol.disable.incapacitated")).map(e => e.id);
                for (let i = 0; i < disableIds.length; i++) {
                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: disableIds[i], disabled: false }] });
                }
                console.warn("Disable Effect on Incapacitated Revert used");
            } catch (err) {
                console.error("Disable Effect on Incapacitated Revert error", err);
            }
        }
        
    } catch(err) {
        console.error("updateActiveEffect Error", err);
    }
});