try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "preItemRoll" || !event.shiftKey) return;
    const effect = args[0].actor.effects.find(e => e.origin == args[0].item.uuid && !e.isSuppressed && !e.flags.dae.dontApply);
    if (effect && effect.disabled) {
        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, disabled: false }] });
    } else if  (effect) {
        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, disabled: true }] });
    }
    return false;
} catch (err) {console.error("Toggle Effect Shift Macro - ", err)}