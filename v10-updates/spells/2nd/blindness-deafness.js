try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects" || !args[0].targets.find(t => t?.actor.effects.find(e => e.origin == args[0].item.uuid && !e.changes.find(e => e.key == "flags.dae.deleteUuid")))) return;
    let dialog = new Promise((resolve) => {
        new Dialog({
        title: "Usage Configuration: Blindness/Deafness",
        content: `<p>Choose a condition to apply:</p>`,
        buttons: {
            confirm: {
                label: "Blinded",
                callback: () => resolve("Blinded")
            },
            cancel: {
                label: "Deafened",
                callback: () => {resolve("Deafened")}
            }
        },
        default: "cancel",
        close: () => {resolve(false)}
        }).render(true);
    });
    let condition = await dialog;
    if (!condition) return;
    const rollId = args[0].item._id + '-' + args[0].itemCardId;
    args[0].targets.forEach(async t => {
        const effect = t?.actor.effects.find(e => e.origin == args[0].item.uuid && !e.changes.find(e => e.key == "flags.dae.deleteUuid"));
        if (!effect) return;
        const effectData = {
			changes: [{ key: "StatusEffect", mode: 0, value: `Convenient Effect: ${condition}`, priority: 20 }],
			disabled: false,
			origin: args[0].item.uuid,
			name: args[0].item.name,
            icon: args[0].item.img,
			duration: { seconds: 60 },
			flags: { "midi-qol": { rollId: rollId } } 
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: t.actor.uuid, effects: [effectData] });
        const conditionEffect = t.actor.effects.find(e => e.flags["midi-qol"]?.rollId == rollId);
        if (conditionEffect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: t.actor.uuid, updates: [{ _id: effect.id, changes: effect.changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: conditionEffect.uuid, priority: 20 }]) }] });
    });
} catch (err) {console.error("Blindness/Deafness Macro - ", err)}