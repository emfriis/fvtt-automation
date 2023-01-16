// completed but not fit for gameplay (slow play)

// cutting words attack roll
try {
    console.warn("Cutting Words Attack Roll activated");
    let wordTokens = await canvas.tokens.placeables.filter(p => {
        let wordToken = (
            p?.actor && // exists
            p.actor.data.flags["midi-qol"].cuttingWords && // has feature
            p.actor.items.find(i => i.name === "Bardic Inspiration" && i.data.data.uses.value) && // feature charged
            !p.actor.effects.find(e => e.data.label === "Reaction") && // has reaction
            p.data.disposition === token.data.disposition && // is friendly
            MidiQOL.getDistance(p, workflow.token, false) <= 60 && // in range
            canSee(p, workflow.token) // can see
        );
        return wordToken;
    });
    for (let w = 0; w < wordTokens.length; w++) {
        let word = wordTokens[w];
        let featItem = word.actor.items.find(i => i.name === "Bardic Inspiration");
        let uses = featItem.data.data.uses.value;
        let player = await playerForActor(word.actor);
        let useWord = false;
        useWord = await USF.socket.executeAsUser("useDialog", player.id, { title: `Cutting Words`, content: `Use your reaction and a bardic inspiration die to reduce the attack roll against ${token.name}?` });
        if (useWord) {
            let actorData = await word.actor.getRollData();
            let bardLevel = actorData.classes?.bard?.levels;
            let bardicDie = bardLevel >= 15 ? "1d12" : bardLevel >= 10 ? "1d10" : bardLevel >= 5 ? "1d8" : bardLevel >= 1 ? "1d6" : null;
            if (!bardicDie) continue;
            let roll = await USF.socket.executeAsUser("rollSimple", player.id, { rollable: bardicDie });
            const effectData = [{
                changes: [{ key: `data.bonuses.All-Attacks`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `-${roll.total}`, priority: 20, }],
                disabled: false,
                label: "Cutting Words Attack Roll Reduction",
                origin: featItem.uuid,
                flags: { dae: { specialDuration: ["1Hit","1Attack","1Spell","DamageDealt"] } },
            }];
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: workflow.actor.uuid, effects: effectData });
            if (featItem) await USF.socket.executeAsGM("updateItem", { itemUuid: featItem.uuid, updates: {"data.uses.value" : Math.max(0, uses - 1) } });
            if (game.combat) game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: word.actor.uuid });
            console.warn("Cutting Words Attack Roll used");
        }
    }
} catch (err) {
    console.error("Cutting Words Attack Roll error", err);
}