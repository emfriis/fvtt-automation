try {
    const effects = args[0].actor.effects.filter(e => e.origin == args[0].item.uuid);
    effects.forEach(async e => {
        let changes = e.changes;
        let radius = e.flags?.ActiveAuras?.radius;
        if (changes.find(c => c.key == "ATL.light.bright") && changes.find(c => c.key == "ATL.light.dim")) {
            for (let c = 0; c < changes.length; c++) {
                if (changes[c].key == "ATL.light.bright") {
                    if (changes[c].value == "30") {
                        changes[c].value = "5";
                    } else if (changes[c].value == "5") {
                        changes[c].value = "30";
                    }
                }
                if (changes[c].key == "ATL.light.dim") {
                    if (changes[c].value == "60") {
                        changes[c].value = "10";
                    } else if (changes[c].value == "10") {
                        changes[c].value = "60";
                    }
                }
                console.error(changes)
            }
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: e._id, changes: changes }] });
        } else if (radius) {
            if (radius == "30") {
                radius = "5";
            } else if (radius == "5") {
                radius = "30";
            }
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: e._id, "flags.ActiveAuras.radius": radius }] });
        }
    });
} catch (err)  {console.error("Lantern of Revealing Macro - ", err)}