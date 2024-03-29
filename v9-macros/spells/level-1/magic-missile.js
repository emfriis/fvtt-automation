// magic missile
// on use before damage

const itemUuid = args[0].uuid;
const attacks = args[0].spellLevel + 2;

if (args[0].targets.length > attacks) {
    return ui.notifications.error("The spell fails, You assigned more targets then you have attacks");
}

let hook = Hooks.on("midi-qol.preDamageRoll", async (workflow) => {

    if (itemUuid === workflow.uuid && workflow.item.system.activation.type !== "none") {

        async function applyAttack(targetUuid) {
            let attackItem = new CONFIG.Item.documentClass(itemData, { parent: workflow.actor });
            let rollOptions = { targetUuids: [targetUuid], showFullCard: false, configureDialog: false };
            await MidiQOL.completeItemRoll(attackItem, rollOptions);
        }

        async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

        const targets = Array.from(workflow.targets);

        const itemData = mergeObject(
            duplicate(workflow.item.data),
            {
                flags: { "midi-qol": { onUseMacroName: null } },
                data: { activation: { type: "none" }, preparation: { mode: "atwill" }, damage: { parts: [[workflow.item.system.damage.parts[0][0], workflow.item.system.damage.parts[0][1]]] } }
            },
        );

        if (targets.length === 1) {
            for (i = 0; i < attacks; i++) {
                await wait(500);
                await applyAttack(targets[0].document.uuid);
            }
        } else if (targets.length === attacks) {
            for (i = 0; i < targets.length; i++) {
                await wait(500);
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
                                        await wait(500);
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
        Hooks.off("midi-qol.preDamageRoll", hook);
        return false;
    }
});