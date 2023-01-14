// steel wind strike
// on use pre attack

const itemUuid = args[0].uuid;
const attacks = args[0].spellLevel;

if (args[0].targets.length > attacks) {
    return ui.notifications.error("The spell fails, You assigned more targets then you have attacks");
}

let hook = Hooks.on("midi-qol.preAttackRoll", async (workflow) => {

    let targets = Array.from(workflow.targets);

    if (itemUuid === workflow.uuid) {

        const itemData = mergeObject(
            duplicate(workflow.item.data),
            {
                //type: "feat",
                flags: {
                    "midi-qol": { onUseMacroName: null }
                },
                data: {
                    activation: { type: "none" },
                    preparation: { mode: "atwill" },
                    damage: { parts: [[workflow.item.data.data.damage.parts[0][0], workflow.item.data.data.damage.parts[0][1]]] }
                }
            },
        );

        async function applyAttack(targetUuid) {
            let attackItem = new CONFIG.Item.documentClass(itemData, { parent: workflow.actor });
            let rollOptions = { targetUuids: [targetUuid], showFullCard: false, configureDialog: false };
            await MidiQOL.completeItemRoll(attackItem, rollOptions);
        }

        async function teleportNearby() {
            let useTeleport = await new Promise((resolve) => {
                new Dialog({
                    title: "Steel Wind Strike",
                    content: "Teleport next to one of the targets?",
                    buttons: {
                        Confirm: {
                            label: "Confirm",
                            callback: async () => {resolve(true)},
                        },
                        Cancel: {
                            label: "Cancel",
                            callback: async () => {resolve(false)},
                        },
                    },
                    default: "Cancel",
                    close: () => {return(false)}
                }).render(true);
            });
            if (useTeleport) {
                const sourceToken = canvas.tokens.get(args[0]?.tokenId);
                const sourceTokenGS = sourceToken.w / canvas.grid.size;
                const teleDist = 30;
                const drawingSize = (sourceToken.w * canvas.grid.size) + (2 * ((30 / canvas.dimensions.distance) * canvas.grid.size));
                const userColor = game.user?.data?.color ? "0x" + game.user.data.color.replace(/^#/, '') : 0x0D26FF;
                const filePath = "modules/autoanimations/src/images/teleportCircle.png";
                const fileIn = "jb2a.misty_step.01.purple";
                const fileOut = "jb2a.misty_step.02.purple";
                const fileSound = "https://assets.forge-vtt.com/630fc11845b0e419bee903cd/combat-sound-fx/magic/effect/teleport-1.ogg";

                let aaSeq01 = new Sequence()
                aaSeq01.effect()
                    .file(filePath)
                    .atLocation(sourceToken)
                    .size(((sourceTokenGS / canvas.grid.size) + 0.5 + (teleDist / canvas.dimensions.distance)) * 2, {gridUnits: true})
                    .fadeIn(500)
                    .scaleIn(0, 500)
                    .fadeOut(500)
                    .name("teleportation")
                    .belowTokens(true)
                    .persist(true)
                    .opacity(0.5)
                    .filter("Glow", {
                        distance: 10,
                        outerStrength: 5,
                        innerStrength: 5,
                        color: userColor,
                        quality: 0.2,
                    })
                    .forUsers(Array.from(game.users).map(user => user.id))
                aaSeq01.play()

                let pos;
                canvas.app.stage.addListener('pointerdown', event => {
                    if (event.data.button !== 0) { return }
                    pos = event.data.getLocalPosition(canvas.app.stage);

                    let topLeft = canvas.grid.getTopLeft(pos.x, pos.y);

                    if (checkDistance(sourceToken, { x: topLeft[0], y: topLeft[1] }) <= teleDist) {
                        if (targets.find(t => t.x >= topLeft[0] - 100 && t.x <= topLeft[0] + 100 && t.y >= topLeft[1] - 100 && t.y <= topLeft[1] + 100)) {
                            deleteTemplatesAndMove();
                            canvas.app.stage.removeListener('pointerdown');
                        } else {
                            ui.notifications.warn("Selected location not next to target");
                        };
                    } else {
                        ui.notifications.warn("Selected location not in range");
                    };
                });

                async function deleteTemplatesAndMove() {

                    let gridPos = canvas.grid.getTopLeft(pos.x, pos.y);
                    let centerPos;
                    if (canvas.scene.gridType === 0) {
                        centerPos = [gridPos[0] + sourceToken.w, gridPos[1] + sourceToken.w];
                    } else {
                        centerPos = canvas.grid.getCenter(pos.x, pos.y);
                    }

                    Sequencer.EffectManager.endEffects({ name: "teleportation" })

                    let aaSeq = new Sequence();
                    aaSeq.effect()
                        .file(fileIn)
                        .atLocation(sourceToken)
                        .size(sourceTokenGS, {gridUnits: true})
                        .randomRotation()
                    aaSeq.sound()
                        .file(fileSound)
                    aaSeq.wait(250)
                    aaSeq.animation()
                        .on(sourceToken)
                        .opacity(0)
                        .teleportTo({ x: gridPos[0], y: gridPos[1] })
                    aaSeq.effect()
                        .file(fileOut)
                        .atLocation({ x: centerPos[0], y: centerPos[1] })
                        .size(sourceTokenGS, {gridUnits: true})
                        .randomRotation()
                    aaSeq.wait(1250)
                    aaSeq.animation()
                        .on(sourceToken)
                        .opacity(1)
                    aaSeq.play()
                }

                // Credit to TPosney / Midi-QOL for the Range Check
                function checkDistance(source, target) {
                    var x, x1, y, y1, d, r, segments = [], rdistance, distance;
                    for (x = 0; x < source.data.width; x++) {
                        for (y = 0; y < source.data.height; y++) {
                            const origin = new PIXI.Point(...canvas.grid.getCenter(source.data.x + (canvas.dimensions.size * x), source.data.y + (canvas.dimensions.size * y)));
                            for (x1 = 0; x1 < 1; x1++) {
                                for (y1 = 0; y1 < 1; y1++) {
                                    const dest = new PIXI.Point(...canvas.grid.getCenter(target.x + (canvas.dimensions.size * x1), target.y + (canvas.dimensions.size * y1)));
                                    const r = new Ray(origin, dest);
                                    segments.push({ ray: r });
                                }
                            }
                        }
                    }
                    if (segments.length === 0) {
                        return -1;
                    }
                    rdistance = canvas.grid.measureDistances(segments, { gridSpaces: true });
                    distance = rdistance[0];
                    rdistance.forEach(d => {
                        if (d < distance)
                            distance = d;
                    });
                    return distance;
                } 
            }      
        }  

        if (targets.length === 1) {
            for (i = 0; i < attacks; i++) {
                await applyAttack(targets[0].document.uuid);
            }
            await teleportNearby();
        } else if (targets.length === attacks) {
            for (i = 0; i < targets.length; i++) {
                await applyAttack(targets[i].document.uuid);
            }
            await teleportNearby();
        } else if (targets.length > 1) {
            let targetContent = "";
            for (i = 0; i < targets.length; i++) {
                targetContent += `
                <tr>
                    <td><img src="${targets[i].data.img}" style="border:0px; width: 100px; height:100px;"></td>
                    <td><input type="num" id="target" min="1" max="${Math.ceil(attacks / targets.length)}" name="${targets[i].document.uuid}"></td>
                </tr>
                `;
            }
            let content = `<p>You have currently <b>${attacks}</b> total ${workflow.item.name} attacks.</p><form class="flexcol"><table width="100%"><tbody><tr><th>Target</th><th>Number Attacks</th></tr>${targetContent}</tbody></table></form>`;   
            await new Dialog({
                title: workflow.item.name,
                content: content,
                buttons: {
                    confirm: {
                        label: "Confirm", callback: async (html) => {
                            let attacksTotal = 0;
                            let selectedTargets = html.find('input#target');
                            for (let targetTotal of selectedTargets) {
                                attacksTotal += Number(targetTotal.value);
                            }
                            if (attacksTotal > attacks) {
                                return ui.notifications.error("The spell fails, You assigned more attacks then you have");
                            } else if (attacksTotal === 0) {
                                return ui.notifications.error("The spell fails, No attacks spent");
                            }
                            for (let target of selectedTargets) {
                                let attackNum = Number(target.value);
                                if (attackNum) {
                                    for (i = 0; i < attackNum; i++) {
                                        await applyAttack(target.name);
                                    }
                                }
                            }
                            await teleportNearby();
                        },
                    },
                },
                default: "close"
            }).render(true);
        }
        Hooks.off("midi-qol.preAttackRoll", hook);
        return false;
    }
});