try {
	if (args[0].macroPass != "postActiveEffects" || !args[0].hitTargets.length || !["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType) || !args[0].damageDetail.find(d => d.type == "slashing")) return;
    if (args[0].isCritical) {
        const effectData = {
            changes: [{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 0, value: "1", priority: 20 }],
            disabled: false,
            origin: args[0].item.uuid,
            name: "Slasher",
            icon: "icons/weapons/swords/scimitar-broad.webp",
            duration: { rounds: 1, turns: 1, seconds: 7 },
            flags: { dae: { specialDuration: ["turnStartSource", "combatEnd"], stackable: "noneName" } }
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
    }
    if (game.combat && game.combat?.current?.tokenId == args[0].tokenId && !args[0].actor.effects.find(e => e.name == "Used Slasher" && !e.disabled)) {
        let dialog = new Promise((resolve) => {
            new Dialog({
            title: "Slasher",
            content: `<p>Use Slasher to reduce the target's speed?</p>`,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: () => resolve(true)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => {resolve(false)}
                }
            },
            default: "cancel",
            close: () => {resolve(false)}
            }).render(true);
        });
        useFeat = await dialog;
        if (!useFeat) return;
        const effectData1 = {
            disabled: false,
            flags: { dae: { specialDuration: ["turnStart", "combatEnd"] } },
			icon: "icons/weapons/swords/scimitar-broad.webp",
            name: "Used Slasher",
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData1] });
        const effectData2 = {
            changes: [{ key: "system.attributes.movement.all", mode: 0, value: "-10", priority: 20 }],
            disabled: false,
            origin: args[0].item.uuid,
            name: "Slasher Movement Penalty",
            icon: "icons/weapons/swords/scimitar-broad.webp",
            duration: { rounds: 1, turns: 1, seconds: 7 },
            flags: { dae: { specialDuration: ["turnStartSource", "combatEnd"], stackable: "noneName" } }
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData2] });
    }
} catch (err) {console.error("Slasher Macro - ", err)}