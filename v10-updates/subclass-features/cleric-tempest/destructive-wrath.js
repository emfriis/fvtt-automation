try {
    if (args[0].tag != "DamageBonus" || (!args[0].hitTargets.length && MidiQOL.configSettings().autoRollDamage == "always") || !args[0].damageRoll.terms.find(t => t.faces && ["lightning", "thunder"].includes(t.flavor.toLowerCase()))) return;
    const usesItem = args[0].actor.items.find(i => i.name.toLowerCase().includes("channel divinity") && i.system.uses.value);
    if (!usesItem) return;
    let dialog = new Promise((resolve) => {
        new Dialog({
        title: "Channel Divinity: Destructive Wrath",
        content: `
        <form id="use-form">
            <p>Expend a use of Channel Divinity to maximise Lightning/Thunder damage?</p>
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
    let newDamageRoll = args[0].workflow.damageRoll;
	newDamageRoll.terms.forEach(async t => {
		if (!t.faces || !["lightning", "thunder"].includes(t.flavor.toLowerCase())) return;
		t.results.forEach(async r => {
			if (r.result >= t.faces) return;
			Object.assign(r, { rerolled: true, active: false });
            t.results.push({ result: t.faces, active: true, hidden: true });
            newDamageRoll._total = newDamageRoll._evaluateTotal();
		});
		await args[0].workflow.setDamageRoll(newDamageRoll);
	});
    await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
    args[0].workflow.destructiveWrath = false;
    if (args[0].item.system.actionType == "save" && ((args[0].item.flags?.midiProperties?.nodam || (!args[0].item.system.description.value?.toLowerCase()?.includes("half as much damage on a successful save") && !args[0].item.system.description.value?.toLowerCase()?.includes("on a successful save, the target takes half as much damage"))) || (args[0].spellLevel == 0 && !args[0].actor.flags["midi-qol"].potentCantrip))) {
        let hook1 = Hooks.on("midi-qol.postCheckSaves", async workflowNext => {
            if (workflowNext.uuid == args[0].uuid && args[0].workflow.destructiveWrath) {
                if (workflowNext.failedSaves.size == 0) {
                    await usesItem.update({ "system.uses.value": usesItem.system.uses.value + 1 });
					args[0].workflow.destructiveWrath = false;
                    Hooks.off("midi-qol.postCheckSaves", hook1);
                    Hooks.off("midi-qol.preItemRoll", hook2);
                }
            }
        });
        let hook2 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
            if (workflowNext.uuid == args[0].uuid) {
                Hooks.off("midi-qol.postCheckSaves", hook1);
                Hooks.off("midi-qol.preItemRoll", hook2);
            }
        });
    }
} catch (err) {console.error("Destructive Wrath Macro - ", err)}