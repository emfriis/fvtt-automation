try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects" || !args[0].targets.find(t => t?.actor.effects.find(e => e.origin == args[0].item.uuid && !e.changes.find(e => e.key == "flags.dae.deleteUuid")))) return;
    let dialog = new Promise((resolve) => {
        new Dialog({
        title: "Usage Configuration: Enlarge/Reduce",
        content: `<p>Enlarge or Reduce target(s)?</p>`,
        buttons: {
            confirm: {
                label: "Enlarge",
                callback: () => resolve("enlarge")
            },
            cancel: {
                label: "Reduce",
                callback: () => {resolve("reduce")}
            }
        },
        default: "cancel",
        close: () => {resolve(false)}
        }).render(true);
    });
    let condition = await dialog;
    if (!condition) return;
    const sizeTypes = {
        grg: { enlarge: "grg", reduce: "huge" },
        huge: { enlarge: "grg", reduce: "lg" },
        lg: { enlarge: "huge", reduce: "med" },
        med: { enlarge: "lg", reduce: "sm" },
        sm: { enlarge: "med", reduce: "tiny" },
        tiny: { enlarge: "sm", reduce: "tiny" }
    }
    const sizeMults = {
        grg: { enlarge: 1, reduce: 0.75 },
        huge: { enlarge: 1.33, reduce: 0.66 },
        lg: { enlarge: 1.5, reduce: 0.5 },
        med: { enlarge: 2, reduce: 1 },
        sm: { enlarge: 1, reduce: 0.25 },
        tiny: { enlarge: 4, reduce: 1 }
    }
    let changes = condition == "enlarge" ? [{ key: "system.bonuses.mwak.damage", mode: 2, value: "1d4", priority: 20 }, { key: "system.bonuses.rwak.damage", mode: 2, value: "1d4", priority: 20 }] : [ { key: "system.bonuses.mwak.damage", mode: 2, value: "-1d4", priority: 20 }, { key: "system.bonuses.rwak.damage", mode: 2, value: "-1d4", priority: 20 }];
    args[0].targets.forEach(async t => {
        const effect = t?.actor.effects.find(e => e.origin == args[0].item.uuid);
        if (!effect) return;
        const originalSize = t.actor.system.traits.size;
        changes = changes.concat([{ key: "system.traits.size", mode: 5, value: sizeTypes[originalSize][condition], priority: 20 }, { key: "ATL.height", mode: 1, value: sizeMults[originalSize][condition], priority: 20 }, { key: "ATL.width", mode: 1, value: sizeMults[originalSize][condition], priority: 20 }]);
        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: t.actor.uuid, updates: [{ _id: effect.id, changes: effect.changes.concat(changes) }] });
    });
} catch (err) {console.error("Enlarge/Reduce Macro - ", err)}