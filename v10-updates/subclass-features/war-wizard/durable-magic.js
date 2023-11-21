try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects") return;
    const conc = args[0].actor.effects.find(e => e.name == "Concentrating" && !e.flags["midi-qol"].durableMagic);
    if (conc) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `system.attributes.ac.bonus`, mode: 2, value: "2", priority: 20 }, { key: `system.bonuses.abilities.save`, mode: 2, value: "2", priority: 20 }]), "flags.midi-qol.durableMagic": true }] });
} catch (err)  {console.error("Durable Magic Macro - ", err)}