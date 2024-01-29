try {
    if (args[0].macroPass == "postActiveEffects") {
        const effectData = {
			changes: [{ key: "flags.midi-qol.trueStrikeTarget", mode: 5, value: args[0].targets[0].id, priority: 20 }, { key: "flags.midi-qol.trueStrikeRound", mode: 5, value: game.combat?.round, priority: 20 }, { key: "flags.midi-qol.advantage.attack.all", mode: 0, value: `targetId=="${args[0].targets[0].id}"`, priority: 20 }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.NIXy4jCZIXL3wkqJ, postAttackRoll", priority: 20 }],
			disabled: false,
			origin: args[0].item.uuid,
			name: "True Strike",
			icon: "icons/magic/fire/dagger-rune-enchant-blue-gray.webp",
			duration: { rounds: 1, turns: 1, seconds: 7 },
            flags: { dae: { specialDuration: ["turnEndSource", "combatEnd"] } }
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    } if (args[0].macroPass == "postAttackRoll" && args[0].targets[0]._id == args[0].actor.flags["midi-qol"].trueStrikeTarget && (!game.combat || (game.combat?.round != args[0].actor.flags["midi-qol"].trueStrikeRound && args[0].tokenId == game.combat?.current?.tokenId))) {
        const effect = args[0].actor.effects.find(e => e.name == "True Strike");
	    if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [effect.id] });
    }
} catch (err)  {console.error("True Strike Macro - ", err)}