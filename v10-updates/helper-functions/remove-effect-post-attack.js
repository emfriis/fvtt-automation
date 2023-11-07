try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postAttackRoll") return;
	const effects = args[0].actor.effects.filter(e => e.changes.find(c => c.key == "flags.midi-qol.onUseMacroName" && c.value.includes("RemoveEffectPostAttack"))).map(e => e.id);
	if (effects) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: effects });
} catch (err)  {console.error("Remove Effect Post Attack Macro - ", err)}