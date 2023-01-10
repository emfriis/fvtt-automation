// preCheckHits

async function canSee(token, target) {
    let canSeeCV = game.modules.get('conditional-visibility')?.api?.canSee(token, target) ?? true;
    let canSeeLOS = !_levels?.advancedLosTestInLos(token, target);
    let canSeeLight = true;
    let inLight = _levels?.advancedLOSCheckInLight(target) ?? true;
    if (!inLight) {
        let vision = Math.min((token.data.flags["perfect-vision"].sightLimit ?? 9999), Math.max(token.data.dimSight, token.data.brightSight));
	    if (!vision || vision < MidiQOL.getDistance(token, target, false)) canSeeLight = false;
    }
    let canSee = canSeeCV && canSeeLOS && canSeeLight;
    return canSee;
}

async function calculateCover(sourceToken, targetToken) {
    const sourceHeight = sourceToken.losHeight;
    const baseZ = targetToken.data.elevation;
    const targetHeight = targetToken.losHeight == baseZ ? baseZ+0.001 : targetToken.losHeight;
    const sourcePov = {  x: sourceToken.center.x, y: sourceToken.center.y, z: sourceHeight, };
    const precision = 15;
    let volPercent = 0;
    let collisionTestPoints = [];
    for (let zC = baseZ; zC <= targetHeight; zC += (targetHeight - baseZ) / precision) {
        for (let yC = targetToken.y; yC <= targetToken.y + targetToken.h; yC += targetToken.h / precision) {
            for (let xC = targetToken.x; xC <= targetToken.x + targetToken.w; xC += targetToken.w / precision) {
                collisionTestPoints.push({ x: xC, y: yC, z: zC });
            }
        }
    }

    for (let point of collisionTestPoints) {
        if (_levels.testCollision(sourcePov, point, "sight")) volPercent++;
    }

    let calculatedCover = (volPercent * 100) / collisionTestPoints.length;

    return calculatedCover;
}

async function calculateTokenCover(sourceToken, targetToken) {
    let distance = MidiQOL.getDistance(sourceToken, targetToken, false);
    let blockingToken = canvas.tokens.placeables.find(p => {
        let distanceToTarget = MidiQOL.getDistance(p, targetToken, false);
        let distanceToSource = MidiQOL.getDistance(p, sourceToken, false);
        let block = (
            p?.actor && // exists
            !(p.actor.data.data.details?.type?.value?.length < 3) && // is a creature
            distanceToTarget <= 5 && // is close to target
            distanceToSource < distance // is closer to source than target
        );
        return block;  
    });

    return blockingToken ? true : false;
}

Hooks.on("midi-qol.preCheckHits", async (workflow) => {
    try {
        if (!["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) return;
    
        const targets = Array.from(workflow.targets);
        for (let t = 0; t < targets.length; t++) {
            let token = targets[t];
            let tactor = token.actor;
            if (!tactor) continue;

            // cover
            if (!(workflow.item.data.data.actionType === "rwak" && workflow.actor.data.flags["midi-qol"].sharpShooter)) {
                try {
                    console.warn("Cover activated");
                    const calculatedCover = await calculateCover(workflow.token, token);
                    const tokenCover = await calculateTokenCover(workflow.token, token);
                    if (calculatedCover >= 99) {
                        const effectData = {
                            changes: [{ key: "data.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 9999, priority: 20, },],
                            disabled: false,
                            label: "Full Cover",
                            flags: { dae: { specialDuration: ["isAttacked"], stackable: "noneName" } }
                        }
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        console.warn("Full Cover used");
                    } else if (calculatedCover >= 65 && !tactor.effects.find(e => e.data.label === "Three-Quarters Cover") && !tactor.effects.find(e => e.data.label === "Half Cover")) {
                        const effectData = {
                            changes: [{ key: "data.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 5, priority: 20, },],
                            disabled: false,
                            label: "Three-Quarters Cover",
                            flags: { dae: { specialDuration: ["isAttacked"], stackable: "noneName" } }
                        }
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        console.warn("3/4 Cover used");
                    } else if ((calculatedCover >= 40 || tokenCover) && !tactor.effects.find(e => e.data.label === "Three-Quarters Cover") && !tactor.effects.find(e => e.data.label === "Half Cover")) {
                        const effectData = {
                            changes: [{ key: "data.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 2, priority: 20, },],
                            disabled: false,
                            label: "Half Cover",
                            flags: { dae: { specialDuration: ["isAttacked"], stackable: "noneName" } }
                        }
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        console.warn("1/2 Cover used");
                    }
                } catch (err) {
                    console.error("Cover error", err);
                }
            }

            // mirror image
            if (tactor.data.flags["midi-qol"].mirrorImage) {
                try {
                    console.warn("Mirror Image activated");
                    const senses = workflow.actor.data.data.attributes.senses;
                    if (!(Math.max(-1, senses.blindsight, senses.tremorsense, senses.truesight) >= MidiQOL.getDistance(workflow.token, token, false)) && await canSee(workflow.token, token)) {
                        let images = tactor.data.flags["midi-qol"].mirrorImage;
                        let dc = images == 3 ? 6 : images == 2 ? 8 : 11;
                        let ac = 10 + tactor.data.data.abilities.dex.mod;
                        const roll = await new Roll(`1d20`).evaluate({ async: false });
                        if (game.dice3d) game.dice3d.showForRoll(roll);
                        if (roll.total >= dc) {
                            if (workflow.attackRoll.total >= ac) {
                                ChatMessage.create({ content: `The Attack strikes a Mirror Image (${images - 1} Image(s) Remaining).` });
                                let effect = tactor.effects.find(e => e.data.label === "Mirror Image");
                                if (images > 1) {
                                    let changes = [
                                        { key: "flags.midi-qol.mirrorImage", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: images - 1, priority: 20, },
                                        { key: "macro.tokenMagic", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "spectral-images", priority: 20, },
                                    ];
                                    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: effect.id, changes: changes }] });
                                } else {
                                    await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                                }
                                workflow.targets.delete(token);
                                let hook = Hooks.on("midi-qol.AttackRollComplete", async (workflowNext) => {
                                    if (workflowNext.uuid === workflow.uuid) {
                                        workflow.targets.add(token);
                                        Hooks.off("midi-qol.AttackRollComplete", hook);
                                    }
                                });
                            } else {
                                ChatMessage.create({ content: `The Attack strikes a Mirror Image (${images} Image(s) Remaining).` });
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
        console.error(`preCheckHits error`, err);
    }
});