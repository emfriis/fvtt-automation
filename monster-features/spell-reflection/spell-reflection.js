// Spell Reflection

Hooks.on("midi-qol.preDamageRoll", async workflow => {
    if (workflow.item.data.type !== "spell" || workflow.item.data.data.target.type !== "creature") return;
    let workflowTargets = Array.from(workflow?.targets);
    let workflowHitTargets = Array.from(workflow?.hitTargets);
    if (!workflowTargets || !workflowHitTargets) return;
    for (let ti = 0; ti < workflowTargets.length; ti++) {
        const t = workflowTargets[ti];
        if (workflowHitTargets.includes(t)) return;
        if (!t.actor.items.find(i => i.data.name === "Spell Reflection") || t.actor.effects.find(e => e.data.label === "Reaction" || e.data.label === "Incapacitated")) return;

        let dialog = new Promise((resolve, reject) => {
            new Dialog({
            title: "Use Reaction: Spell Reflection",
            content: `<p>Use Spell Reflection?</p>`,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: () => resolve(true)
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => {resolve(false)}
                }
            },
            default: "two",
            close: callBack => {resolve(false)}
            }).render(true);
        });
        let useAbil = await dialog;
        if (!useAbil) return;

        let newTargets = await canvas.tokens.placeables.filter((i) => {
            let newTarget = (
                i.actor && // exists
                i.document.uuid !== t.document.uuid && // not me
                MidiQOL.getDistance(t, i, false) <= 30 && // within 30 ft
                (game.modules.get('conditional-visibility')?.api?.canSee(t, i) && _levels?.advancedLosTestVisibility(t, i)) // can see
            );
            return newTarget;
        });

        if (newTargets.length < 1) {
            ui.notifications.warn("No nearby Creatures found");
            return;
        } else if (newTargets.length === 1) {
            workflow?.targets.delete(t);
            const itemCopy = duplicate(workflow.item);
            const attackItem = new CONFIG.Item.documentClass(itemCopy, { parent: workflow.actor });
            let rollOptions = { targetUuids: [newTargets[0].document.uuid], showFullCard: false, createWorkflow: true };
            await MidiQOL.completeItemRoll(attackItem, rollOptions);
            if (game?.combat) await game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: t.actor.uuid });
            return;
        }
        
        let target_content = "";
        newTargets.forEach((t) => {
            target_content += `<label class="radio-label">
            <input type="radio" name="target" value="${t.id}">
            <img src="${t.data.img}" style="border:0px; width: 100px; height:100px;">
            </label>`;
        });
        
        let content = `
        <style>
        .target .form-group {
            display: flex;
            flex-wrap: wrap;
            width: 100%;
            align-items: flex-start;
            }
        
            .target .radio-label {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            justify-items: center;
            flex: 1 0 25%;
            line-height: normal;
            }
        
            .target .radio-label input {
            display: none;
            }
        
            .target img {
            border: 0px;
            width: 50px;
            height: 50px;
            flex: 0 0 50px;
            cursor: pointer;
            }
        
            /* CHECKED STYLES */
            .target [type=radio]:checked + img {
            outline: 2px solid #f00;
            }
        </style>
        <form class="target">
            <div class="form-group" id="target">
                ${target_content}
            </div>
        </form>
        `;
        
        let dialog2 = new Promise(async (resolve, reject) => {
            new Dialog({
                title: "Spell Reflection: Choose a new target",
                content,
                buttons: {
                    Choose: {
                        label: "Choose",
                        callback: async () => {
                            const selectedId = $("input[type='radio'][name='target']:checked").val();
                            const replaceTarget = canvas.tokens.get(selectedId);
                            workflow?.targets.delete(t);
                            const itemCopy = duplicate(workflow.item);
                            const attackItem = new CONFIG.Item.documentClass(itemCopy, { parent: t.actor });
                            let rollOptions = { targetUuids: [replaceTarget.document.uuid], showFullCard: false, createWorkflow: true };
                            await MidiQOL.completeItemRoll(attackItem, rollOptions);
                            if (game?.combat) await game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: t.actor.uuid });
                            resolve(true);
                        }
                    },
                    Cancel: {
                        label: "Cancel",
                        callback: async () => {resolve(false)}
                    }
                },
                default: "Cancel"
            }).render(true);
        });
        await dialog2;
    };
});

Hooks.on("midi-qol.postCheckSaves", async workflow => {
    if (workflow.item.data.type !== "spell" || workflow.item.data.data.target.type !== "creature") return;
    let workflowTargets = Array.from(workflow?.targets);
    let workflowFailedSaves = Array.from(workflow?.failedSaves);
    if (!workflowTargets || !workflowFailedSaves) return;
    for (let ti = 0; ti < workflowTargets.length; ti++) {
        const t = workflowTargets[ti];
        if (workflowFailedSaves.includes(t)) return;
        if (!t.actor.items.find(i => i.data.name === "Spell Reflection") || t.actor.effects.find(e => e.data.label === "Reaction" || e.data.label === "Incapacitated")) return;

        let dialog = new Promise((resolve, reject) => {
            new Dialog({
            title: "Use Reaction: Spell Reflection",
            content: `<p>Use Spell Reflection?</p>`,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: () => resolve(true)
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => {resolve(false)}
                }
            },
            default: "two",
            close: callBack => {resolve(false)}
            }).render(true);
        });
        let useAbil = await dialog;
        if (!useAbil) return;

        let newTargets = await canvas.tokens.placeables.filter((i) => {
            let newTarget = (
                i.actor && // exists
                i.document.uuid !== t.document.uuid && // not me
                MidiQOL.getDistance(t, i, false) <= 30 && // within 30 ft
                (game.modules.get('conditional-visibility')?.api?.canSee(t, i) && _levels?.advancedLosTestVisibility(t, i)) // can see
            );
            return newTarget;
        });

        if (newTargets.length < 1) {
            ui.notifications.warn("No nearby Creatures found");
            return;
        } else if (newTargets.length === 1) {
            workflow?.targets.delete(t);
            const itemCopy = duplicate(workflow.item);
            const attackItem = new CONFIG.Item.documentClass(itemCopy, { parent: workflow.actor });
            let rollOptions = { targetUuids: [newTargets[0].document.uuid], showFullCard: false, createWorkflow: true };
            await MidiQOL.completeItemRoll(attackItem, rollOptions);
            if (game?.combat) await game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: t.actor.uuid });
            return;
        }
        
        let target_content = "";
        newTargets.forEach((t) => {
            target_content += `<label class="radio-label">
            <input type="radio" name="target" value="${t.id}">
            <img src="${t.data.img}" style="border:0px; width: 100px; height:100px;">
            </label>`;
        });
        
        let content = `
        <style>
        .target .form-group {
            display: flex;
            flex-wrap: wrap;
            width: 100%;
            align-items: flex-start;
            }
        
            .target .radio-label {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            justify-items: center;
            flex: 1 0 25%;
            line-height: normal;
            }
        
            .target .radio-label input {
            display: none;
            }
        
            .target img {
            border: 0px;
            width: 50px;
            height: 50px;
            flex: 0 0 50px;
            cursor: pointer;
            }
        
            /* CHECKED STYLES */
            .target [type=radio]:checked + img {
            outline: 2px solid #f00;
            }
        </style>
        <form class="target">
            <div class="form-group" id="target">
                ${target_content}
            </div>
        </form>
        `;
        
        let dialog2 = new Promise(async (resolve, reject) => {
            new Dialog({
                title: "Spell Reflection: Choose a new target",
                content,
                buttons: {
                    Choose: {
                        label: "Choose",
                        callback: async () => {
                            const selectedId = $("input[type='radio'][name='target']:checked").val();
                            const replaceTarget = canvas.tokens.get(selectedId);
                            workflow?.targets.delete(t);
                            const itemCopy = duplicate(workflow.item);
                            const attackItem = new CONFIG.Item.documentClass(itemCopy, { parent: t.actor });
                            let rollOptions = { targetUuids: [replaceTarget.document.uuid], showFullCard: false, createWorkflow: true };
                            await MidiQOL.completeItemRoll(attackItem, rollOptions);
                            if (game?.combat) await game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: t.actor.uuid });
                            resolve(true);
                        }
                    },
                    Cancel: {
                        label: "Cancel",
                        callback: async () => {resolve(false)}
                    }
                },
                default: "Cancel"
            }).render(true);
        });
        await dialog2;
    };
});