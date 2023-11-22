try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "preambleComplete") return;
    let dialog = new Promise((resolve) => {
        new Dialog({
        title: "Usage Configuration: Produce Flame",
        content: `<p>Use Produce Flame to create light or attack?</p>`,
        buttons: {
            attack: {
                label: "Attack",
                callback: () => resolve(true)
            },
            light: {
                label: "Light",
                callback: () => {resolve(false)}
            }
        },
        default: "attack",
        close: () => {resolve(false)}
        }).render(true);
    });
    let attack = await dialog;
    if (attack) {
        const effects = args[0].actor.effects.filter(e => e.name == "Produce Flame").map(e => e.id);
	    if (effects) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: effects });
    } else {
        const effects = args[0].actor.effects.filter(e => e.name == "Produce Flame").map(e => e.id);
	    if (effects) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: effects });
        const effectData = {
            disabled: false,
            duration: { seconds: 600 },
			icon: "icons/magic/fire/projectile-fireball-embers-yellow.webp",
            name: "Produce Flame",
            origin: args[0].item.uuid,
            changes: [{ key: "ATL.light.dim", mode: 4, value: "20", priority: "20" }, { key: "ATL.light.bright", mode: 4, value: "10", priority: "20" }, { key: "ATL.light.color", mode: 5, value: "#F28C28", priority: "20" }, { key: "ATL.light.alpha", mode: 5, value: "0.1", priority: "20" }, { key: "ATL.light.animation", mode: 5, value: "{ 'type': 'pulse', 'speed': 3,'intensity': 1}", priority: "20" }]
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        Hooks.once("midi-qol.preAttackRoll", async workflowNext => {
            if (workflowNext.uuid == args[0].uuid) {
                return false;
            }
        });
    }
} catch (err)  {console.error("Produce Flame Macro - ", err)}