try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects" || args[0].item.type != "spell" || args[0].item.system.school != "con") return;
    const conc = args[0].actor.effects.find(e => e.name == "Concentrating" && !e.flags["midi-qol"].focusedConjurationMagic);
    if (conc) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: "flags.midi-qol.concentrationSaveBonus", mode: 2, value: "99", priority: 20 }]), "flags.midi-qol.focusedConjuration": true }] });
} catch (err)  {console.error("Focused Conjuration Macro - ", err)}