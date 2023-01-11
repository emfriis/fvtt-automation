// updateItem

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

Hooks.on("updateItem", async (item) => {
    try {

        const tactor = item.parent;
        if (!tactor) return;

        // enable effect on armor
        if (item.isArmor && item.data.data.equipped && tactor.effects.find(e => e.data.disabled && e.data.changes.find(c => c.key?.includes(`flags.midi-qol.enable.armor`)))) {
            try {
                console.warn("Enable Effect on Armor activated");
                const enableIds = tactor.effects.filter(e => e.data.disabled && e.data.changes.find(c => c.key === `flags.midi-qol.enable.armor.${item.data.data.armor?.type}` || (c.key === `flags.midi-qol.enable.armor.all` && item.data.data.armor?.type !== "shield"))).map(e => e.id);
                for (let i = 0; i < enableIds.length; i++) {
                    await wait(100);
                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: enableIds[i], disabled: false }] });
                }
                console.warn("Enable Effect on Armor used");
            } catch (err) {
                console.error("Enable Effect on Armor error", err);
            }
        }

        // enable effect on armor revert
        if (item.isArmor && !item.data.data.equipped && tactor.data.flags["midi-qol"]?.enable?.armor) {
            try {
                console.warn("Enable Effect on Armor Revert activated");
                const enableIds = tactor.effects.filter(e => !e.data.disabled && e.data.changes.find(c => c.key?.includes(`flags.midi-qol.enable.armor`) && !tactor.items.find(i => i.isArmor && i.data.data.equipped && ((c.key === `flags.midi-qol.enable.all` && item.data.data.armor?.type !== "shield")) || i.data.data.armor?.type === c.key.match(/armor.(.*)/)))).map(e => e.id);
                for (let i = 0; i < enableIds.length; i++) {
                    await wait(100);
                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: enableIds[i], disabled: true }] });
                }
                console.warn("Enable Effect on Armor Revert used");
            } catch (err) {
                console.error("Enable Effect on Armor Revert error", err);
            }
        }

        // disable effect on armor
        if (item.isArmor && item.data.data.equipped && (tactor.data.flags["midi-qol"]?.disable?.armor[item.data.data.armor?.type] || tactor.data.flags["midi-qol"]?.disable?.armor?.all)) {
            try {
                console.warn("Disable Effect on Armor activated");
                const disableIds = tactor.effects.filter(e => !e.data.disabled && e.data.changes.find(c => c.key === `flags.midi-qol.disable.armor.${item.data.data.armor?.type}` || (c.key === `flags.midi-qol.disable.armor.all` && item.data.data.armor?.type !== "shield"))).map(e => e.id);
                console.warn(disableIds);
                for (let i = 0; i < disableIds.length; i++) {
                    await wait(100);
                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: disableIds[i], disabled: true }] });
                }
                console.warn("Disable Effect on Armor used");
            } catch (err) {
                console.error("Disable Effect on Armor error", err);
            }
        }

        // disable effect on armor revert
        if (item.isArmor && !item.data.data.equipped && tactor.effects.find(e => e.data.disabled && e.data.changes.find(c => c.key?.includes(`flags.midi-qol.disable.armor`)))) {
            try {
                console.warn("Disable Effect on Armor Revert activated");
                const disableIds1 = tactor.effects.filter(e => e.data.disabled && e.data.changes.find(c => c.key === `flags.midi-qol.disable.armor.${item.data.data.armor?.type}`)).map(e => e.id);
                for (let i = 0; i < disableIds1.length; i++) {
                    await wait(100);
                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: disableIds1[i], disabled: false }] });
                }
                if (!tactor.items.find(i => i.isArmor && i.data.data.equipped) && tactor.effects.find(e => e.data.disabled && e.data.changes.find(c => c.key?.includes(`flags.midi-qol.disable.armor.all`)))) {
                    const disableIds2 = tactor.effects.filter(e => e.data.disabled && e.data.changes.find(c => c.key === `flags.midi-qol.disable.armor.all` && item.data.data.armor?.type !== "shield")).map(e => e.id);
                    for (let i = 0; i < disableIds2.length; i++) {
                        await wait(100);
                        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: disableIds2[i], disabled: false }] });
                    }
                }
                console.warn("Disable Effect on Armor Revert used");
            } catch (err) {
                console.error("Disable Effect on Armor Revert error", err);
            }
        }
        
    } catch(err) {
        console.error("updateItem Error", err);
    }
});