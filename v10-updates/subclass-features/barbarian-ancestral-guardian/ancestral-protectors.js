try {
    if (args[0].macroPass == "postActiveEffects" && (args[0].hitTargets.length || MidiQOL.configSettings().autoRollDamage != "always") && ["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType) && args[0].actor.effects.find(e => e.name == "Rage") && (!game.combat || game.combat?.current?.tokenId == args[0].tokenId) && (!game.combat || !args[0].actor.effects.find(e => e.name == "Used Ancestral Protectors" && !e.disabled))) {
        const effectData1 = {
			changes: [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.CPR8CFZ85VFgpXhq, postDamageRoll", priority: 20, }, { key: "flags.midi-qol.ancestralProtectors", mode: 5, value: `${args[0].actor.uuid}`, priority: 20, }, { key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: `targetActorUuid!="${args[0].actor.uuid}"`, priority: 20 }],
			disabled: false,
			origin: args[0].item.uuid,
			name: "Ancestral Protectors",
			icon: "icons/creatures/magical/spirit-undead-ghost-blue.webp",
			duration: { rounds: 1, seconds: 7 },
			flags: { dae: { specialDuration: ["turnStartSource", "combatEnd"], stackable: "noneName" } }
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData1] });
        if (game.combat) {
            const effectData2 = {
                disabled: false,
                flags: { dae: { specialDuration: ["turnStart", "combatEnd"] } },
                icon: "icons/creatures/magical/spirit-undead-ghost-blue.webp",
                name: "Used Ancestral Protectors"
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData2] });
        }
	} else if (args[0].macroPass == "postDamageRoll" && ["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType) && args[0].actor.flags["midi-qol"].ancestralProtectors && args[0].targets[0].actor.uuid != args[0].actor.flags["midi-qol"].ancestralProtectors) {
		const effectData = {
            disabled: false,
            changes: [{ key: "system.traits.dr.all", mode: 0, value: 1, priority: 20, }],
            icon: "icons/creatures/magical/spirit-undead-ghost-blue.webp",
            name: "Ancestral Protectors Damage Resistance"
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
        Hooks.once("midi-qol.damageApplied", async () => {
            const effects = args[0].targets[0].actor.effects.filter(e => e.name == "Ancestral Protectors Damage Resistance").map(e => e.id);
            if (effects) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: effects });
        });
	}
} catch (err) {console.error("Ancestral Protectors Macro - ", err)}