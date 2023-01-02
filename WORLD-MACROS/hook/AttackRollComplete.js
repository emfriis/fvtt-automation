// AttackRollComplete

function canSee(token, target) {
    let canSeeCV = game.modules.get('conditional-visibility')?.api?.canSee(token, target);
    let canSeeLos = _levels?.advancedLosTestVisibility(token, target);
    let canSeeLight = true;
    let inLight = _levels?.advancedLOSCheckInLight(target);
    if (!inLight) {
        let vision = Math.min((token.data.flags["perfect-vision"].sightLimit ? token.data.flags["perfect-vision"].sightLimit : 9999), Math.max(token.data.dimSight, token.data.brightSight));
        if (vision < MidiQOL.getDistance(token, target, false)) canSeeLight = false;
    }
    let canSee = canSeeCV && canSeeLos && canSeeLight;
    return canSee;
}

Hooks.on("midi-qol.AttackRollComplete", async (workflow) => {
    try {
        if (!["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) return;
    
        const targets = Array.from(workflow.targets);
        for (let t = 0; t < targets.length; t++) {
            let token = targets[t];
            let tactor = token.actor;
            if (!tactor) continue;

            // mirror image
            if (tactor.data.flags["midi-qol"].mirrorImage) {
                try {
                    console.warn("Mirror Image activated");
                    const senses = workflow.actor.data.data.attributes.senses;
                    if (!(Math.max(-1, senses.blindsight, senses.tremorsense, senses.truesight) >= MidiQOL.getDistance(workflow.token, token, false)) && await canSee(workflow.token, token)) {
                        let images = tactor.effects.filter(i => i.data.label === "Mirror Image").length;
                        let dc = images === 3 ? 6 : images === 2 ? 8 : images === 1 ? 11 : 9999;
                        let ac = 10 + tactor.data.data.abilities.dex.mod;
                        const roll = await new Roll(`1d20`).evaluate({ async: false });
                        if (game.dice3d) game.dice3d.showForRoll(roll);
                        if (roll.total >= dc) {
                            ChatMessage.create({ content: "The attack strikes a mirror image." });
                            workflow.isFumble = true;
                            if (workflow.attackRoll.total >= ac) {
                                let effect = tactor.effects.find(i => i.data.label === "Mirror Image");
                                await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                            }
                        }
                        console.warn("Mirror Image used");
                    }
                } catch (err) {
                    console.error("Mirror Image error", err);
                }
            }
        }
    } catch(err) {
        console.error(`AttackRollComplete error`, err);
    }
});