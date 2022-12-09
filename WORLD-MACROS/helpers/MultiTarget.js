// multi target

const itemUuid = args[0].uuid;
const attacks = args[0].spellLevel;

if (args[0].targets.length > attacks) {
    return ui.notifications.error("The spell fails, You assigned more targets then you have attacks");
}

let hook = Hooks.on("midi-qol.preAttackRoll", async (workflow) => {
    if (itemUuid === workflow.uuid) {

        const itemData = mergeObject(
            duplicate(workflow.item.data),
            {
                type: "feat",
                flags: {
                    "midi-qol": {
                        onUseMacroName: null
                    }
                },
                data: {
                    activation: {
                        type: "none"
                    }
                }
            },
        );
        await workflow.actor.createEmbeddedDocuments("Item", [itemData]);
        const attackItem = workflow.actor.items.find(i => i.name === workflow.item.name && i.data.data.activation.type === "none");

        async function applyAttack(targetUuid) {
            let rollOptions = { targetUuids: [targetUuid], showFullCard: false };
            MidiQOL.completeItemRoll(attackItem, rollOptions);
        };

        async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

        if (workflow.targets.size === 1) {
            workflow.targets.forEach( async target => {
                for (i = 0; i < attacks; i++) {
                    await wait(500);
                    await applyAttack(target.document.uuid);
                }
            });
        } else if (workflow.targets.size === attacks) {
            workflow.targets.forEach( async target => {
                await wait(500);
                await applyAttack(target.document.uuid);
            });
        } else if (lastArg.targets.length > 1) {
            let targetContent = "";
            workflow.targets.forEach( async target => {
                targetContent += `
                <tr>
                    <td><img src="${target.data.img}" style="border:0px; width: 100px; height:100px;"></td>
                    <td><input type="num" id="target" min="1" max="${Math.ceil(attacks / workflow.targets.size)}" uuid="${target.document.uuid}"></td>
                </tr>
                `;
            });
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
                                        await wait(500);
                                        await applyAttack(target.uuid);
                                    };
                                };
                            };
                        },
                    },
                },
                default: "close"
            }).render(true);
        };
        Hooks.off("midi-qol.preAttackRoll", hook);
        await wait(500);
        await workflow.actor.deleteEmbeddedDocuments("Item", [attackItem.id]);
        return false;
    }
});