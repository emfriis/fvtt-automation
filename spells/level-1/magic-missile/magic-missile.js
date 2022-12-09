// magic missile

(async () => {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.tokenUuid);
    const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

    const itemSource = await fromUuid(lastArg.uuid);
    const itemCopy = mergeObject(
        duplicate(itemSource),
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
    const attackItem = new CONFIG.Item.documentClass(itemCopy, { parent: tactor });
    const attacks = 2 + Number(lastArg.spellLevel);

    async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

    async function applyAttack(targetUuid) {
        let rollOptions = { targetUuids: [targetUuid], showFullCard: false };
        await MidiQOL.completeItemRoll(attackItem, rollOptions);
    };

    let workflow = await MidiQOL.Workflow.getWorkflow(lastArg.uuid);
    await Object.assign(workflow, { targets: null, noAutoAttack: true, noAutoDamage: true });

    if (lastArg.targets.length === 1) {
        for (i = 0; i < attacks; i++) {
            await wait(250);
            await applyAttack(lastArg.targets[0].uuid);
        }
    } else if (lastArg.targets.length > 1) {
        let targetContent = "";
        lastArg.targets.forEach((t) => {
            targetContent += `
            <tr>
                <td><img src="${t.data.img ?? t.img}" style="border:0px; width: 100px; height:100px;"></td>
                <td><input type="num" id="target" min="0" max="${attacks}" name="${t.uuid}"></td>
            </tr>
            `;
        });
        let content = `<p>You have currently <b>${attacks}</b> total ${lastArg.item.name} attacks.</p><form class="flexcol"><table width="100%"><tbody><tr><th>Target</th><th>Number Attacks</th></tr>${targetContent}</tbody></table></form>`;   
        await new Dialog({
            title: `${lastArg.item.name}`,
            content: content,
            buttons: {
                confirm: {
                    label: "Confirm", callback: async (html) => {
                        let spentTotal = 0;
                        let selected_targets = html.find('input#target');
                        for (let get_total of selected_targets) {
                            spentTotal += Number(get_total.value);
                        }
                        if (spentTotal > attacks) {
                            errorMessage = `The spell fails, You assigned more attacks then you have.`;
                            return ui.notifications.error(errorMessage);
                        }
                        if (spentTotal === 0) {
                            errorMessage = `The spell fails, No attacks spent.`;
                            return ui.notifications.error(errorMessage);
                        }
                        for (let target of selected_targets) {
                            let attackNum = Number(target.value);
                            if (attackNum) {
                                for (i = 0; i < attackNum; i++) {
                                    await wait(250);
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
})();