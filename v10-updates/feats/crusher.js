try {
	if (args[0].macroPass != "postActiveEffects" || !args[0].hitTargets.length || !args[0].isCritical || !["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType) || !args[0].damageDetail.find(d => d.type == "bludgeoning")) return;
    const effectData = {
        changes: [{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 0, value: "1", priority: 20 }],
        disabled: false,
        origin: args[0].item.uuid,
        name: "Crusher",
        icon: "icons/weapons/hammers/shorthammer-double-stone-engraved.webp",
        duration: { rounds: 1, turns: 1, seconds: 7 },
        flags: { dae: { specialDuration: ["turnStartSource", "combatEnd"], stackable: "noneName" } }
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
} catch (err) {console.error("Crusher Macro - ", err)}