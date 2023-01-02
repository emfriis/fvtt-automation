// preCheckHits

function calculateCover(sourceToken, targetToken) {
    const sourceHeight = sourceToken.losHeight;
    const baseZ = targetToken.data.elevation;
    const targetHeight = targetToken.losHeight == baseZ ? baseZ+0.001 : targetToken.losHeight;
    const sourcePov = {  x: sourceToken.center.x, y: sourceToken.center.y, z: sourceHeight, };
    const precision = 10;
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
                    if (calculatedCover >= 99) {
                        const effectData = {
                            changes: [{ key: "data.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 9999, priority: 20, },],
                            disabled: false,
                            label: "Full Cover",
                            flags: { dae: { specialDuration: ["isAttacked"] } }
                        }
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        console.warn("Full Cover used");
                    } else if (calculatedCover >= 65 && !tactor.effects.find(e => e.data.label === "Three-Quarters Cover") && !tactor.effects.find(e => e.data.label === "Half Cover")) {
                        const effectData = {
                            changes: [{ key: "data.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 5, priority: 20, },],
                            disabled: false,
                            label: "Three-Quarters Cover",
                            flags: { dae: { specialDuration: ["isAttacked"] } }
                        }
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        console.warn("3/4 Cover used");
                    } else if (calculatedCover >= 40 && !tactor.effects.find(e => e.data.label === "Three-Quarters Cover") && !tactor.effects.find(e => e.data.label === "Half Cover")) {
                        const effectData = {
                            changes: [{ key: "data.attributes.ac.bonus", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 2, priority: 20, },],
                            disabled: false,
                            label: "Half Cover",
                            flags: { dae: { specialDuration: ["isAttacked"] } }
                        }
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        console.warn("1/2 Cover used");
                    }
                } catch (err) {
                    console.error("Cover error", err);
                }
            }
        }
    } catch(err) {
        console.error(`preCheckHits error`, err);
    }
});