try {
    if (!args[0].tag.includes("OnUse")) return;
    const effect = args[0].actor.effects.find(e => e.name == "Emboldening Bond");
    const source = game.actors.get(effect.origin.match(/Actor\.(.*?)\./)[1]) ?? canvas.tokens.placeables.find(t => t.actor && t.actor.id == effect.origin.match(/Actor\.(.*?)\./)[1]).actor;
    const range = source.classes.cleric.system.levels > 16 ? 60 : 30;
    const nearby = canvas.tokens.placeables.find(t => t.actor && t.actor.uuid != args[0].actor.uuid && t.actor.effects.find(e => e.origin == effect.origin) && MidiQOL.computeDistance(args[0].workflow.token, t, false) <= range);
    console.error(effect, source, range, nearby)
    if (nearby) return;
    if (args[0].tag == "OnUse" && args[0].macroPass == "preAttackRoll") {
        await effect.update({ disabled: true });
        let hook = Hooks.on("midi-qol.AttackRollComplete", async workflowNext => {
            if (workflowNext.uuid == args[0].uuid) {
                await effect.update({ disabled: false });
                console.error(effect);
                Hooks.off("midi-qol.AttackRollComplete", hook);
            }
        });
    } else if (args[0].tag == "TargetOnUse" && args[0].macroPass == "preTargetSave") {
        await effect.update({ disabled: true });
        let hook = Hooks.on("midi-qol.postCheckSaves", async workflowNext => {
            if (workflowNext.uuid == args[0].uuid) {
                await effect.update({ disabled: false });
                console.error(effect);
                Hooks.off("midi-qol.postCheckSaves", hook);
            }
        });
    }
} catch (err) {console.error("Emboldening Bond Macro - ", err)}