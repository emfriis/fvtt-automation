//stunning strike
try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postDamageRoll" || args[0].item.system.actionType !== "mwak" || !args[0].hitTargets.length) return;
    const usesItem = args[0].actor.items.find(i => i.name === "Ki" && i.system.uses.value);
    const target = args[0].hitTargets[0].actor;
    if (!usesItem || !target) return;
    let dialog = new Promise((resolve) => {
        new Dialog({
        title: "Stunning Strike: Usage Configuration",
        content: `
        <form id="use-form">
            <p>Expend a Ki Point to use Stunning Strike?</p>
            <p>(` + usesItem.system.uses.value + ` Ki Remaining)</p>
        </form>
        `,
        buttons: {
            confirm: {
                icon: '<i class="fas fa-check"></i>',
                label: "Confirm",
                callback: () => resolve(true)
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel",
                callback: () => {resolve(false)}
            }
        },
        default: "cancel",
        close: () => {resolve(false)}
        }).render(true);
    });
    ki = await dialog;
    const itemData = {
        name: "Ki: Stunning Strike",
        img: "icons/skills/melee/unarmed-punch-fist-blue.webp",
        type: "feat",
        system: {
            activation: { type: "special" },
            target: { type: "self" },
            range: { units: "self" },
            actionType: "save",
            save: { ability: "con", dc: `${8 + args[0].actor.system.attributes.prof + args[0].actor.system.abilities.wis.mod}`, scaling: "flat" },
        },
        effects: [{ 
            changes: [{ key: "macro.CE", mode: 0, value: "Stunned", priority: 20 }], 
            disabled: false,
            transfer: false,
            isSuppressed: false, 
            icon: "icons/skills/melee/unarmed-punch-fist-blue.webp", 
            name: "Stunning Strike", 
            duration: { rounds: 1, turns: 1 },
            flags: { dae: { specialDuration: ["turnEndSource"] } }
        }],
        flags: { autoanimations: { isEnabled: false } }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: target });
    await MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
    await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
} catch (err) {console.error("Stunning Strike Macro - ", err)}

//ki: focused aim
try {
    if (args[0].tag === "OnUse" && args[0].macroPass === "preCheckHits" && args[0].attackRoll && !args[0].isFumble && args[0].targets[0]?.actor && args[0].targets[0].actor.system.attributes.ac.value < args[0].attackRoll.total) return;
    const usesItem = args[0].actor.items.find(i => i.name === "Ki" && i.system.uses.value);
    const workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid); 
    if (!usesItem) return;
    let dialog = new Promise((resolve) => {
        new Dialog({
        title: "Focused Aim: Usage Configuration",
        content: `
        <form id="use-form">
            <p>Expend 1-3 Ki Points to add 2-6 to the attack roll? (Attack Total: ${workflow.attackRoll.total})</p>
            <p>(${usesItem.system.uses.value} Ki Remaining)</p>
        </form>
        `,
        buttons: {
            1: {
                icon: '<i class="fas fa-check"></i>',
                label: "1 Ki (+2)",
                callback: () => resolve(1)
            },
            2: {
                icon: '<i class="fas fa-check"></i>',
                label: "2 Ki (+4)",
                callback: () => resolve(2)
            },
            3: {
                icon: '<i class="fas fa-check"></i>',
                label: "3 Ki (+6)",
                callback: () => resolve(3)
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel",
                callback: () => {resolve(false)}
            }
        },
        default: "cancel",
        close: () => {resolve(false)}
        }).render(true);
    });
    ki = await dialog;
    if (ki > usesItem.system.uses.value) return ui.notifications.warn("Not enough Ki Points remaining");
    let bonusRoll = await new Roll('0 + ' + `${2 * ki}`).evaluate({async: true});
    for (let i = 1; i < bonusRoll.terms.length; i++) {
        args[0].attackRoll.terms.push(bonusRoll.terms[i]);
    }
    args[0].attackRoll._total += bonusRoll.total;
    args[0].attackRoll._formula = args[0].attackRoll._formula + ' + ' + `${2 * ki}`;
    workflow.setAttackRoll(args[0].attackRoll);
    await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - ki) });
} catch (err) {console.error("Ki: Focused Aim Macro - ", err)}