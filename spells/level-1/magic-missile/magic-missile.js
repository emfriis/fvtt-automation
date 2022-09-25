// magic missile

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const item = lastArg.item;
const itemSource = await fromUuid(lastArg.uuid);
const itemCopy = duplicate(itemSource);
setProperty(itemCopy, "flags.itemacro.command", "");
setProperty(itemCopy, "flags.itemacro.macro", {});
setProperty(itemCopy, "flags.midi-qol.onUseMacroName", "");
//setProperty(itemCopy, "data.preparation.mode", "atwill");
setProperty(itemCopy, "type", "feat");
const attackItem = new CONFIG.Item.documentClass(itemCopy, { parent: tactor });

const attacks = 2 + Number(lastArg.spellLevel);

async function applyAttack(targetUuid) {
    let rollOptions = { targetUuids: [targetUuid], showFullCard: false, createWorkflow: true };
    await MidiQOL.completeItemRoll(attackItem, rollOptions);
}

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
            <td><img src="${t.data.img}" style="border:0px; width: 100px; height:100px;"></td>
            <td><input type="num" id="target" min="0" max="${attacks}" name="${t.uuid}"></td>
        </tr>
        `;
    });

    let content = `<p>You have currently <b>${attacks}</b> total ${item.name} attacks.</p><form class="flexcol"><table width="100%"><tbody><tr><th>Target</th><th>Number Attacks</th></tr>${targetContent}</tbody></table></form>`;
    
    let dialog = new Promise(async (resolve, reject) => {
        let errorMessage;
        new Dialog({
            title: `${item.name}`,
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
                            errorMessage = `The spell fails, You assigned more bolts then you have.`;
                            return ui.notifications.error(errorMessage);
                        }
                        if (spentTotal === 0) {
                            errorMessage = `The spell fails, No bolts spent.`;
                            return ui.notifications.error(errorMessage);
                        }
                        for (let target of selected_targets) {
                            let attackNum = Number(target.value);
                            if (attackNum) {
                                for (i = 0; i < attackNum; i++) {
                                    await wait(250);
                                    await applyAttack(target.name);
                                }
                            }
                        }
                    }
                }
            },
            close: async (html) => {
                if(errorMessage) reject(new Error(errorMessage));
            },
            default: "confirm"
        }).render(true);
    });
    await dialog;
}

let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
await Object.assign(workflow, { shouldRollDamage: false });
await Object.assign(workflow, { targets: [] });