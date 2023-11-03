try {
    if (args[0] != "on") return;
	const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    const genieKind = actor.flags["midi-qol"]?.genieKind;
    if (genieKind) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: lastArg.efData._id, changes: [{ key: "system.traits.dr.value", mode: 0, value: genieKind, priority: "20" }] }] });
} catch (err) {console.error("Elemental Gift Macro - ", err)}