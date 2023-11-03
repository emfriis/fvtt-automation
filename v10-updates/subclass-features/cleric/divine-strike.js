try {
    if (args[0] != "off") return;
	const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    const usesItem = actor.items.find(i => i.uuid == lastArg.efData.origin);
    const efData = lastArg.efData;
    const recharge = lastArg.efData.changes.find(c => c.key == "flags.midi-qol.longRestRecharge");
    recharge.value = `${+recharge.value - 1}`;
    if (recharge.value > 0) { 
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [efData] });
    } else {
        await usesItem.update({ "system.uses.value": 1 });
    }
} catch (err) {console.error("Long Rest Recharge Macro - ", err)}