// credit to levels auto cover author theripper93 for the cover functions
function calculateCover(source, targetToken) {
    const sourceHeight = source.losHeight;
    const baseZ = targetToken.document.elevation;
    const targetHeight = targetToken.losHeight == baseZ ? baseZ+0.001 : targetToken.losHeight;
    const sourcePov = {  x: source.center.x, y: source.center.y, z: sourceHeight, };
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
        if (CONFIG.Levels.API.testCollision(sourcePov, point, "sight")) volPercent++;
    }

    let calculatedCover = (volPercent * 100) / collisionTestPoints.length;

    return calculatedCover;
}

function calculateTokenCover(source, targetToken) {
    let distance = calculateDistance(source, targetToken);
    let padd = 4;
    let blockingToken = canvas.tokens.placeables.find(p => {
        let distanceToSource = calculateDistance(source, p);
        let closer = (
            p?.actor && // exists
            p.document.uuid !== source?.document?.uuid && // not attacker
            p.document.uuid !== targetToken?.document?.uuid && // not target
            p.actor.system.traits.size !== "tiny" && // not tiny
            MidiQOL.typeOrRace(p) && // is a creature
            distanceToSource < distance // is closer to source than target
        );
        if (!closer) return false;
        return segmentBoxIntersection(
            { x: source.center.x, y: source.center.y, z: source.losHeight },
            { x: targetToken.center.x, y: targetToken.center.y, z: targetToken.losHeight == targetToken.document.elevation ? targetToken.document.elevation + 0.001 : targetToken.losHeight },
            { x: p.x + padd, y: p.y + padd, z: p.document.elevation, },
            { x: p.x + p.w - padd, y: p.y + p.h - padd, z: p.losHeight }
        );
    });

    return blockingToken ? true : false;
}

function calculateDistance(source, targetToken) {
    const deltaX = targetToken.center.x - source.center.x;
    const deltaY = targetToken.center.y - source.center.y;
    const deltaZ = targetToken.document.elevation - source.losHeight;
    
    const distance = Math.sqrt(deltaX**2 + deltaY**2 + deltaZ**2);
    return distance;
}

function segmentBoxIntersection(p0, p1, b0, b1) {
    const x0 = p0.x;
    const y0 = p0.y;
    const z0 = p0.z;
    const x1 = p1.x;
    const y1 = p1.y;
    const z1 = p1.z;
    const faces = [
        [
            //Back Face
            { x: b0.x, y: b0.y, z: b0.z },
            { x: b0.x, y: b0.y, z: b1.z },
            { x: b1.x, y: b0.y, z: b1.z },
            { x: b1.x, y: b0.y, z: b0.z },
        ],
        [
            //Front Face
            { x: b0.x, y: b1.y, z: b0.z },
            { x: b0.x, y: b1.y, z: b1.z },
            { x: b1.x, y: b1.y, z: b1.z },
            { x: b1.x, y: b1.y, z: b0.z },
        ],
        [
            //Left Face
            { x: b0.x, y: b0.y, z: b0.z },
            { x: b0.x, y: b0.y, z: b1.z },
            { x: b0.x, y: b1.y, z: b1.z },
            { x: b0.x, y: b1.y, z: b0.z },
        ],
        [
            //Right Face
            { x: b1.x, y: b0.y, z: b0.z },
            { x: b1.x, y: b0.y, z: b1.z },
            { x: b1.x, y: b1.y, z: b1.z },
            { x: b1.x, y: b1.y, z: b0.z },
        ],
    ];

    //check if a line intersects a box
    function boxCollisionTest() {
        for (let face of faces) {
            //declare points in 3d space of the rectangle created by the wall
            const wx1 = face[0].x;
            const wx2 = face[1].x;
            const wx3 = face[2].x;
            const wy1 = face[0].y;
            const wy2 = face[1].y;
            const wy3 = face[2].y;
            const wz1 = face[0].z;
            const wz2 = face[1].z;
            const wz3 = face[2].z;
            const wallBotTop = [Math.min(wz1, wz2, wz3), Math.max(wz1, wz2, wz3)];

            //calculate the parameters for the infinite plane the rectangle defines
            const A = wy1 * (wz2 - wz3) + wy2 * (wz3 - wz1) + wy3 * (wz1 - wz2);
            const B = wz1 * (wx2 - wx3) + wz2 * (wx3 - wx1) + wz3 * (wx1 - wx2);
            const C = wx1 * (wy2 - wy3) + wx2 * (wy3 - wy1) + wx3 * (wy1 - wy2);
            const D =
            -wx1 * (wy2 * wz3 - wy3 * wz2) -
            wx2 * (wy3 * wz1 - wy1 * wz3) -
            wx3 * (wy1 * wz2 - wy2 * wz1);

            //solve for p0 p1 to check if the points are on opposite sides of the plane or not
            const P1 = A * x0 + B * y0 + C * z0 + D;
            const P2 = A * x1 + B * y1 + C * z1 + D;

            //don't do anything else if the points are on the same side of the plane
            if (P1 * P2 > 0) continue;

            //calculate intersection point
            const t =
            -(A * x0 + B * y0 + C * z0 + D) /
            (A * (x1 - x0) + B * (y1 - y0) + C * (z1 - z0)); //-(A*x0 + B*y0 + C*z0 + D) / (A*x1 + B*y1 + C*z1)
            const ix = x0 + (x1 - x0) * t;
            const iy = y0 + (y1 - y0) * t;
            const iz = Math.round(z0 + (z1 - z0) * t);

            //return true if the point is inisde the rectangle
            const isb = isBetween(
            { x: Math.min(wx1, wx2, wx3), y: Math.min(wy1, wy2, wy3) },
            { x: Math.max(wx1, wx2, wx3), y: Math.max(wy1, wy2, wy3) },
            { x: ix, y: iy }
            );
            if (isb && iz <= wallBotTop[1] && iz >= wallBotTop[0]) return true;
        }
        return false;
    }

    //Check if a point in 2d space is betweeen 2 points
    function isBetween(a, b, c) {
        //test
        //return ((a.x<=c.x && c.x<=b.x && a.y<=c.y && c.y<=b.y) || (a.x>=c.x && c.x >=b.x && a.y>=c.y && c.y >=b.y))

        const dotproduct = (c.x - a.x) * (b.x - a.x) + (c.y - a.y) * (b.y - a.y);
        if (dotproduct < 0) return false;

        const squaredlengthba = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
        if (dotproduct > squaredlengthba) return false;

        return true;
    }

    return boxCollisionTest();
}

Hooks.on("midi-qol.preAttackRollComplete", async (workflow) => {
    try {
        if (!["mwak","rwak","msak","rsak"].includes(workflow.item.system.actionType)) return;
    
        const targets = Array.from(workflow.targets);
        for (let t = 0; t < targets.length; t++) {
            let token = targets[t];
            let tactor = token.actor;
            if (!tactor) continue;

            // attack cover
            if (!(workflow.item.system.actionType == "rsak" && workflow.actor.flags["midi-qol"].spellSniper) && !((workflow.item.system.actionType == "rwak" || (workflow.item.system.actionType == "mwak" && workflow.item.system.properties.thr)) && workflow.actor.flags["midi-qol"].sharpShooter)) {
                try {
                    const source = workflow.templateData ? { center: { x: workflow.templateData.x, y: workflow.templateData.y }, losHeight: workflow.templateData.flags?.levels?.elevation ?? 0 } : workflow.token;
                    console.warn("Attack Cover activated");
                    const calculatedCover = await calculateCover(source, token);
                    console.warn("Attack Wall Cover", calculatedCover);
                    const calculatedTokenCover = await calculateTokenCover(source, token);
                    console.warn("Attack Token Cover", calculatedTokenCover);
                    if (calculatedCover >= 65 && !tactor.effects.find(e => e.name.includes("Three-Quarters Cover"))) {
                        const effectData = {
                            changes: [{ key: "system.attributes.ac.bonus", mode: 2, value: "+3", priority: 20, },],
                            disabled: false,
                            name: "Three-Quarters Cover",
                            flags: { dae: { specialDuration: ["isAttacked","isHit"] } }
                        }
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        let hook = Hooks.on("midi-qol.AttackRollComplete", async (workflowNext) => {
                            if (workflowNext.uuid == workflow.uuid) {
                                await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [tactor.effects.filter(e => e.name.includes("Three-Quarters Cover")).map(e => e.id)] });
                                Hooks.off("midi-qol.AttackRollComplete", hook);
                            }
                        });
                        console.warn("Attack 3/4 Cover used");
                    }
                    if ((calculatedCover >= 40 || calculatedTokenCover) && !tactor.effects.find(e => e.name.includes("Half Cover"))) {
                        const effectData = {
                            changes: [{ key: "system.attributes.ac.bonus", mode: 2, value: "+2", priority: 20, },],
                            disabled: false,
                            name: "Half Cover",
                            flags: { dae: { specialDuration: ["isAttacked","isHit"] } }
                        }
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        let hook = Hooks.on("midi-qol.AttackRollComplete", async (workflowNext) => {
                            if (workflowNext.uuid == workflow.uuid) {
                                await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [tactor.effects.filter(e => e.name.includes("Half Cover")).map(e => e.id)] });
                                Hooks.off("midi-qol.AttackRollComplete", hook);
                            }
                        });
                        console.warn("Attack 1/2 Cover used");
                    }
                } catch (err) {
                    console.error("Attack Cover Macro Error - ", err);
                }
            }
        }
    } catch(err) {
        console.error("preAttackRollComplete Macro Error - ", err);
    }
});

Hooks.on("midi-qol.preCheckSaves", async (workflow) => {
    try {
	    const targets = Array.from(workflow.hitTargets);
        for (let t = 0; t < targets.length; t++) {
            let token = targets[t];
            let tactor = token.actor;
		    if (!tactor) continue;

            // save cover
            if (workflow.item.system.save.dc && workflow.item.system.save.ability === "dex" && workflow.item.system.actionType !== "abil") {
                try {
                    const source = workflow.templateData ? { center: { x: workflow.templateData.x, y: workflow.templateData.y }, losHeight: workflow.templateData.flags?.levels?.elevation ?? 0 } : workflow.token;
                    console.warn("Save Cover activated");
                    const calculatedCover = await calculateCover(source, token);
                    console.warn("Save Wall Cover", calculatedCover);
                    const calculatedTokenCover = await calculateTokenCover(source, token);
                    console.warn("Save Token Cover", calculatedTokenCover);
                    if (calculatedCover >= 65 && !tactor.effects.find(e => e.name.includes("Three-Quarters Cover"))) {
                        const effectData = {
                            changes: [{ key: "system.abilities.dex.bonuses.save", mode: 2, value: "+3", priority: 20, },],
                            disabled: false,
                            name: "Three-Quarters Cover",
                            flags: { dae: { specialDuration: ["isSave"] } }
                        }
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        let hook = Hooks.on("midi-qol.postCheckSaves", async (workflowNext) => {
                            if (workflowNext.uuid == workflow.uuid) {
                                await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [tactor.effects.filter(e => e.name.includes("Three-Quarters Cover")).map(e => e.id)] });
                                Hooks.off("midi-qol.postCheckSaves", hook);
                            }
                        });
                        console.warn("Attack 3/4 Cover used");
                    }
                    if ((calculatedCover >= 40 || calculatedTokenCover) && !tactor.effects.find(e => e.name.includes("Half Cover"))) {
                        const effectData = {
                            changes: [{ key: "system.abilities.dex.bonuses.save", mode: 2, value: "+2", priority: 20, },],
                            disabled: false,
                            name: "Half Cover",
                            flags: { dae: { specialDuration: ["isSave"] } }
                        }
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        let hook = Hooks.on("midi-qol.postCheckSaves", async (workflowNext) => {
                            if (workflowNext.uuid == workflow.uuid) {
                                await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [tactor.effects.filter(e => e.name.includes("Half Cover")).map(e => e.id)] });
                                Hooks.off("midi-qol.postCheckSaves", hook);
                            }
                        });
                        console.warn("Attack 1/2 Cover used");
                    }
                } catch (err) {
                    console.error("Save Cover Macro Error - ", err);
                }
            }
        }
    } catch(err) {
        console.error("preCheckSaves Macro Error - ", err);
    }
});