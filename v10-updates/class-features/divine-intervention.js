try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects") {
        const level = args[0].actor.classes.cleric.system.levels;
        const effectData = {
            changes: [{ key: "macro.execute", mode: 0, value: "DivineIntervention", priority: 20 }], 
            disabled: false, 
            icon: args[0].item.img, 
            name: args[0].item.name + " Recharge", 
            flags: { dae: {} }
        }
        if (args[0].damageRoll.total <= level || level == 20) {
            effectData.duration = { seconds: 604800 }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        } else {
            effectData.flags.dae.specialDuration = ["longRest"];
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        }
    } else if (args[0] == "off") {
        const lastArg = args[args.length-1];
        const tokenOrActor = await fromUuid(lastArg.actorUuid);
        const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
        const usesItem = actor.items.find(i => i.name == "Divine Intervention" && i.system.uses);
        await usesItem.update({ "system.uses.value": 1 });
    }
} catch (err) {console.error("Divine Invervention Macro - ", err)}