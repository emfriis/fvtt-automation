// sanctuary world macro
// bases dc off sanctuary spell item ability

if (!game.modules.get("midi-qol")?.active || !game.modules.get("conditional-visibility")?.active || !game.modules.get("levels")?.active || !_levels) throw new Error("requisite module(s) missing");

Hooks.on("midi-qol.preItemRoll", async (workflow) => {
    if (!workflow?.actor || !workflow?.token || !workflow?.targets) return;
    const isAttack = ["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType);
    const targets = Array.from(workflow.targets);
    for (let t = 0; t < targets.length; t++) {
        const token = targets[t];
        if (!token?.actor) continue;
        const ef = token.actor.effects.find(i => i.data.label === "Sanctuary");
        if (!ef) continue;
        const isHarmSpell = workflow.item.data.data.target.type === "creature" && workflow.token.data.disposition !== token.data.disposition;
        if (!isAttack && !isHarmSpell) continue;
        const item = await fromUuid(ef.data.origin);
        const parent = item?.parent;
        const dc = 8 + parent.data.data.attributes.prof + parent.data.data.abilities[`${item.data.data.ability}`].mod;
        const rollOptions = { chatMessage: true, fastForward: true };
        const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: "save", targetUuid: workflow.actor.uuid, ability: "wis", options: rollOptions });
        if (game.dice3d) game.dice3d.showForRoll(roll);
        if (roll.total >= dc) continue;

        const range = workflow.item.data.data.range.value ?? 5;
        let newTargets = await canvas.tokens.placeables.filter((i) => {
            let newTarget = (
                i?.actor && // exists
                i?.document.uuid !== workflow.token.document.uuid && // not me
                i?.document.uuid !== token.document.uuid && // not original target
                i?.data.disposition !== workflow.token.data.disposition && // not friendly
                MidiQOL.getDistance(workflow.token, i, false) <= range && // within range
                (game.modules.get('conditional-visibility')?.api?.canSee(workflow.token, i) && _levels?.advancedLosTestVisibility(workflow.token, i)) // can see
            );
            return newTarget;
        });
        
        if (newTargets.length === 0) {
            return false;
        } else if (newTargets.length === 1) {
            if (isAttack) Hooks.once("midi-qol.preAttackRoll", async (workflowNext) => {
                if (workflowNext.uuid === workflow.uuid) {
                    workflowNext?.targets?.delete(token);
                    workflowNext?.targets?.add(newTargets[0]);
                };
            });
            if (isHarmSpell && !isAttack) Hooks.once("midi-qol.preCheckSaves", async (workflowNext) => {
                if (workflowNext.uuid === workflow.uuid) {
                    workflowNext?.targets?.delete(token);
                    workflowNext?.hitTargets?.delete(token);
                    workflowNext?.saves?.delete(token);
                    workflowNext?.targets?.add(replaceTarget);
                    workflowNext?.hitTargets?.add(replaceTarget);
                    workflowNext?.saves?.add(replaceTarget);
                };
            });
            continue;
        };
        
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
             
        let dialog = new Promise(async (resolve, reject) => {
            new Dialog({
                title: "Sanctuary: Choose a new target",
                content,
                buttons: {
                    Choose: {
                        label: "Choose",
                        callback: async () => {
                            const selectedId = $("input[type='radio'][name='target']:checked").val();
                            const replaceTarget = canvas.tokens.get(selectedId);
                            if (isAttack) Hooks.once("midi-qol.preAttackRoll", async (workflowNext) => {
                                if (workflowNext.uuid === workflow.uuid) {
                                    workflowNext?.targets?.delete(token);
                                    workflowNext?.targets?.add(replaceTarget);
                                };
                            });
                            if (isHarmSpell && !isAttack) Hooks.once("midi-qol.preCheckSaves", async (workflowNext) => {
                                if (workflowNext.uuid === workflow.uuid) {
                                    workflowNext?.targets?.delete(token);
                                    workflowNext?.hitTargets?.delete(token);
                                    workflowNext?.saves?.delete(token);
                                    workflowNext?.targets?.add(replaceTarget);
                                    workflowNext?.hitTargets?.add(replaceTarget);
                                    workflowNext?.saves?.add(replaceTarget);
                                };
                            });
                            resolve(true);
                        }
                    },
                },
            }).render(true);
        });
        await dialog;
        if (!dialog) return false;
    };
});