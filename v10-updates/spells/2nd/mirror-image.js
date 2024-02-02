try {
    if (args[0].macroPass != "isAttacked") return;
    const senses = args[0].actor.system.attributes.senses;
    if (Math.max(-1, senses.blindsight, senses.tremorsense, senses.truesight) >= MidiQOL.computeDistance(workflow.token, args[0].targets[0], false) && await MidiQOL.canSense(workflow.token, args[0].targets[0])) return;
    let images = args[0].targets[0].actor.flags["midi-qol"].mirrorImage;
    let dc = images == 3 ? 6 : images == 2 ? 8 : 11;
    let ac = 10 + args[0].targets[0].actor.system.abilities.dex.mod;
    let roll = await new Roll('1d20').evaluate({async: true});
    if (game.dice3d) game.dice3d.showForRoll(roll);
    if (roll.total >= dc) {
        const effectData = {
            changes: [{ key: "flags.midi-qol.grants.attack.fail.all", mode: 0, value: "1", priority: 20 }],
            disabled: false,
            duration: { seconds: 1, turns: 1 },
            flags: { dae: { specialDuration: ["combatEnd", "isAttacked"] } },
            name: "Mirror Image Protection",
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        if (workflow.attackRoll.total >= ac) {
            ChatMessage.create({ content: `The attack strikes a Mirror Image (${images - 1} Image(s) Remaining).` });
            let effect = args[0].targets[0].actor.effects.find(e => e.name == "Mirror Image");
            if (images > 1) {
                let changes = [
                    { key: "flags.midi-qol.mirrorImage", mode: 5, value: images - 1, priority: 20 },
                    { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.Fh67FZS5gMWsewhJ, isAttacked", priority: 20 },
                ];
                await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].targets[0].actor.uuid, updates: [{ _id: effect.id, changes: changes }] });
            } else {
                await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effect.id] });
            }
        } else {
            ChatMessage.create({ content: `The attack misses a Mirror Image (${images} Image(s) Remaining).` });
        }
    }
} catch (err) {console.error("Mirror Image Macro - ", err)}