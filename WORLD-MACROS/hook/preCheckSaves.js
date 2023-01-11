// preCheckSaves

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

// credit to levels auto cover author theripper93 for the cover functions
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
    let padd = 4;
    let blockingToken = canvas.tokens.placeables.find(p => {
        let distanceToSource = MidiQOL.getDistance(p, sourceToken, false);
        let closer = (
            p?.actor && // exists
            p.document.uuid !== sourceToken.document.uuid && // not attacker
            p.document.uuid !== targetToken.document.uuid && // not target
            p.actor.data.data.traits.size !== "tiny" && // not tiny
            !(p.actor.data.data.details?.type?.value?.length < 3) && // is a creature
            distanceToSource < distance // is closer to source than target
        );
        if (!closer) return false;
        return segmentBoxIntersection(
            { x: sourceToken.center.x, y: sourceToken.center.y, z: sourceToken.losHeight },
            { x: targetToken.center.x, y: targetToken.center.y, z: targetToken.losHeight == targetToken.data.elevation ? targetToken.data.elevation + 0.001 : targetToken.losHeight },
            { x: p.x + padd, y: p.y + padd, z: p.data.elevation, },
            { x: p.x + p.w - padd, y: p.y + p.h - padd, z: p.losHeight }
        );
    });

    return blockingToken ? true : false;
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

Hooks.on("midi-qol.preCheckSaves", async (workflow) => {
    try {
	    const targets = Array.from(workflow.hitTargets);
        for (let t = 0; t < targets.length; t++) {
            let token = targets[t];
            let tactor = token.actor;
		    if (!tactor) continue;

            // save cover
            if (workflow.item.data.data.save.dc && workflow.item.data.data.save.ability === "dex" && workflow.item.data.data.actionType !== "abil" && ["creature","enemy","",null,undefined].includes(workflow.item.data.data.target.type)) {
                try {
                    console.warn("Save Cover activated");
                    const calculatedCover = await calculateCover(workflow.token, token);
                    console.warn("Attack Wall Cover", calculatedCover);
                    const calculatedTokenCover = await calculateTokenCover(workflow.token, token);
                    console.warn("Attack Token Cover", calculatedTokenCover);
                    if (calculatedCover >= 99) {
                        let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
                            if (actor === tactor && abilityId === workflow.item.data.data.save.ability) {
                                rollData.parts.push("9999");
                                Hooks.off("Actor5e.preRollAbilitySave", hook);
                            }
                        });
                        console.warn("Save Full Cover used");
                    } else if (calculatedCover >= 65 && !tactor.effects.find(e => e.data.label === "Three-Quarters Cover") && !tactor.effects.find(e => e.data.label === "Half Cover")) {
                        let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
                            if (actor === tactor && abilityId === workflow.item.data.data.save.ability) {
                                rollData.parts.push("5");
                                Hooks.off("Actor5e.preRollAbilitySave", hook);
                            }
                        });
                        console.warn("Save 3/4 Cover used");
                    } else if ((calculatedCover >= 40 || calculatedTokenCover) && !tactor.effects.find(e => e.data.label === "Three-Quarters Cover") && !tactor.effects.find(e => e.data.label === "Half Cover")) {
                        let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
                            if (actor === tactor && abilityId === workflow.item.data.data.save.ability) {
                                rollData.parts.push("2");
                                Hooks.off("Actor5e.preRollAbilitySave", hook);
                            }
                        });
                        console.warn("Save 1/2 Cover used");
                    }
                } catch (err) {
                    console.error("Save Cover error", err);
                }
            }

            // spell resistance save
            if ((workflow.item.data.type === "spell" || workflow.item.data.flags?.midiProperties?.spelleffect) && workflow.item.data.data.save.dc && workflow.item.data.data.actionType !== "abil" && tactor.data.flags["midi-qol"]?.spellResistance?.save) {
                try {
                    console.warn("Spell Resistance Save activated");
                    let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
                        if (actor === tactor && abilityId === workflow.item.data.data.save.ability) {
                            rollData.advantage = true;
                            Hooks.off("Actor5e.preRollAbilitySave", hook);
                        }
                    });
                    console.warn("Spell Resistance Save used");
                } catch (err) {
                    console.error("Spell Resistance Save error", err);
                }
            }

            // resilience
            if (workflow.item.data.data.save.dc && workflow.item.data.data.actionType !== "abil" && tactor.data.flags["midi-qol"].resilience) {
                try {
                    console.warn("Resilience activated");
                    const resilience = Object.keys(tactor.data.flags["midi-qol"].resilience);
                    let resilientCondition, resilientDamage;
                    resilientCondition = resilience.find(r => workflow.item.name.toLowerCase().includes(r)) || workflow.item.data.effects.contents.find(e => resilience.includes(e.data.label.toLowerCase()) || e.data.changes.find(c => c.key === "StatusEffect" && resilience.find(r => c.value?.toLowerCase()?.includes(r))));
                    if (!resilientCondition) resilientDamage = workflow.item.data.data.damage.parts.find(p => resilience.includes(p[1]?.toLowerCase())) && !workflow.item.data.data.midiProperties?.fulldam || resilience.find(r => workflow.item.data.data.formula?.toLowerCase()?.includes(r));
                    if (resilientCondition || resilientDamage) {
                        let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
                            if (actor === tactor && abilityId === workflow.item.data.data.save.ability) {
                                rollData.advantage = true;
                                Hooks.off("Actor5e.preRollAbilitySave", hook);
                            }
                        });
                        console.warn("Resilience used");
                    }

                } catch (err) {
                    console.error("Resilience error", err);
                }
            }

            // shield master
            if (workflow.item.data.data.save.ability === "dex" && workflow.item.data.data.actionType !== "abil" && targets.length === 1 && tactor.data.flags["midi-qol"].shieldMaster && tactor.items.find(i => i.isArmor && i.data.data?.armor?.type === "shield" && i.data.data?.equipped) && !tactor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(e.data.label))) {
                try {
                    console.warn("Shield Master activated");
                    let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
                        if (actor === tactor && abilityId === workflow.item.data.data.save.ability) {
                            rollData.parts.push(`${tactor.items.find(i => i.isArmor && i.data.data?.armor?.type === "shield" && i.data.data?.equipped).data.data.armor.value}`);
                            Hooks.off("Actor5e.preRollAbilitySave", hook);
                        }
                    });
                    console.warn("Shield Master used");
                } catch(err) {
                    console.error("Shield Master error", err);
                }
		    }
        }
    } catch(err) {
        console.error("preCheckSaves error", err);
    }
});