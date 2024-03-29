// eldritch blast
// on use pre attack

const tokenOrActor = await fromUuid(args[0].tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const itemUuid = args[0].uuid;
const tactorLevel = tactor.data.type === "character" ? tactor.data.data.details.level : tactor.data.data.details.cr;
const attacks = 1 + Math.floor((tactorLevel + 1) / 6);

if (args[0].targets.length > attacks) {
    return ui.notifications.error("The spell fails, You assigned more targets then you have attacks");
}

let hook = Hooks.on("midi-qol.preAttackRoll", async (workflow) => {

    if (itemUuid === workflow.uuid && workflow.item.data.data.activation.type !== "none") {

        const targets = Array.from(workflow.targets);

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

        if (targets.length === 1) {
            for (i = 0; i < attacks; i++) {
                await applyAttack(targets[0].document.uuid);
            }
        } else if (targets.length === attacks) {
            for (i = 0; i < targets.length; i++) {
                await applyAttack(targets[i].document.uuid);
            }
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
        return false;
    }
});