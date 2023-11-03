try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "preItemRoll") {
		const actors = new Set(game.actors.contents.concat(canvas.tokens.placeables.map(t => t?.actor)).filter(a => a.effects.find(e => e.origin == args[0].item.uuid)));
		actors.forEach(async a => {
			effects = a.effects.filter(e => e.origin == args[0].item.uuid).map(e => e.id);
			if (effects) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: a.uuid, effects: effects });
		});
    }
} catch (err)  {console.error("PerUseEffect Macro - ", err)}