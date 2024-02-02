try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "preCheckHits" || !args[0].attackRoll || args[0].isFumble || args[0].isCritical || !args[0].targets[0]?.actor || args[0].targets[0].actor.system.attributes.ac.value < args[0].attackRoll.total) return;
    const usesItem = args[0].actor.items.find(i => i.name.toLowerCase().includes("channel divinity") && i.system.uses.value);
    if (!usesItem) return;
    let dialog = new Promise((resolve) => {
        new Dialog({
        title: "Channel Divinity: Guided Strike",
        content: `
        <form id="use-form">
            <p>Expend a use of Channel Divinity to add 10 to the attack roll? (Attack Total: ${args[0].workflow.attackRoll.total})</p>
            <p>(${usesItem.system.uses.value} uses of Channel Divinity Remaining)</p>
        </form>
        `,
        buttons: {
            confirm: {
                icon: '<i class="fas fa-check"></i>',
                label: "Confirm",
                callback: () => {resolve(true)}
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
    useFeat = await dialog;
    if (!useFeat) return;
    let bonusRoll = await new Roll('0 + ' + '10').evaluate({async: true});
    for (let i = 1; i < bonusRoll.terms.length; i++) {
        args[0].attackRoll.terms.push(bonusRoll.terms[i]);
    }
    args[0].attackRoll._total += bonusRoll.total;
    args[0].attackRoll._formula = args[0].attackRoll._formula + ' + ' + '10';
    await args[0].workflow.setAttackRoll(args[0].attackRoll);
    await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
} catch (err) {console.error("Guided Strike Macro - ", err)}