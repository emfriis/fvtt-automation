try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects" || !args[0].workflow.defaultDamageType || !args[0].targets?.length) return;
    const damageType = args[0].workflow.defaultDamageType.toLowerCase();
    const types = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"];
    if (!types.includes(damageType)) return;
    args[0].targets.forEach(async (t) => {
        const effects = t?.actor?.effects.filter(e => e.origin == args[0].item.uuid);
        if (!effects?.length) return;
        effects.forEach(async (e) => {
            let changes = e.changes;
            let update = false;
            changes.forEach(async (c) => { 
                let value = c.value;
                types.forEach(async (d) => { value = value.replace(d , damageType); });
                if (value != c.value) {
                    c.value = value;
                    update = true;
                }
            });
            if (update) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: e._id, changes: changes }] });
        });
    });
} catch (err) {console.error("Effect Update Damage Type Macro - ", err)}