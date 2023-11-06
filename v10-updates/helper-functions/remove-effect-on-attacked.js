try {
    if (args[0].tag != "TargetOnUse" || args[0].macroPass != "isAttacked") return;
	const effects = args[0].options.actor.effects.find(e => e.changes.find(c => c.key == "flags.midi-qol.onUseMacroName" && c.value.includes("RemoveEffectOnAttacked"))).map(e => e.id);
	if (effects) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].options.actor.uuid, effects: effects });
} catch (err)  {console.error("Remove Effect on Attacked Macro - ", err); }