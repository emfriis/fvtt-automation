// createActiveEffect

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

Hooks.on("createActiveEffect", async (effect) => {
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
                const deleteIds = tactor.effects.filter(e => e.data.changes.find(c => c.key === "flags.midi-qol.delete.incapacitated")).map(e => e.id);
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
                    await wait(100);
                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: disableIds[i], disabled: true }] });
                }
                console.warn("Disable Effect on Incapacitated used");
            } catch (err) {
                console.error("Disable Effect on Incapacitated error", err);
            }
        }

        // delete effect on incapacitated creation
        if (effect.data.changes.find(c => c.key === "flags.midi-qol.delete.incapacitated") && tactor.effects.find(e => !e.data.disabled && ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(e.data.label))) {
            try {
                console.warn("Delete Effect on Incapacitated Creation activated");
                await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: effect.id });
                console.warn("Delete Effect on Incapacitated Creation used");
            } catch (err) {
                console.error("Delete Effect on Incapacitated Creation error", err);
            }
        }

        // disable effect on incapacitated creation
        if (effect.data.changes.find(c => c.key === "flags.midi-qol.disable.incapacitated") && !effect.data.disabled && tactor.effects.find(e => !e.data.disabled && ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(e.data.label))) {
            try {
                console.warn("Disable Effect on Incapacitated Creation activated");
                await wait(100);
                await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: effect.id, disabled: true }] });
                console.warn("Disable Effect on Incapacitated Creation used");
            } catch (err) {
                console.error("Disable Effect on Incapacitated Creation error", err);
            }
        }

        // enable effect on armor revert creation
        if (effect.data.changes.find(c => c.key?.includes(`flags.midi-qol.enable.armor`))) {
            try {
                console.warn("Enable Effect on Armor Revert Creation activated");
                const enableTypes = effect.data.changes.filter(c => c.key?.includes(`flags.midi-qol.enable.armor`)).map(c => c.key.match(/armor.(.*)/)[1]);
                if (!tactor.items.find(i => i.isArmor && i.data.data.equipped && (enableTypes.includes(i.data.data.armor.type) || (enableTypes.includes("all") && i.data.data.armor.type !== "shield")))) {
                    await wait(100);
                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: effect.id, disabled: true }] });
                    console.warn("Enable Effect on Armor Revert Creation used");
                }
            } catch (err) {
                console.error("Enable Effect on Armor Revert Creation error", err);
            }
        }

        // disable effect on armor creation
        if (effect.data.changes.find(c => c.key?.includes(`flags.midi-qol.disable.armor`))) {
            try {
                console.warn("Disable Effect on Armor Creation activated");
                const disableTypes = effect.data.changes.filter(c => c.key?.includes(`flags.midi-qol.disable.armor`)).map(c => c.key.match(/armor.(.*)/)[1]);
                if (tactor.items.find(i => i.isArmor && i.data.data.equipped && (disableTypes.includes(i.data.data.armor.type) || (disableTypes.includes("all") && i.data.data.armor.type !== "shield")))) {
                    await wait(100);
                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: effect.id, disabled: true }] });
                    console.warn("Disable Effect on Armor Creation used");
                }
            } catch (err) {
                console.error("Disable Effect on Armor Creation error", err);
            }
        }

    } catch(err) {
        console.error("createActiveEffect Error", err);
    }
});