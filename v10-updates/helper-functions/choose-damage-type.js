try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "preDamageRoll") return;
    let hook1 = Hooks.on("midi-qol.preDamageRollComplete", async workflowNext => {
        if (workflowNext.uuid == args[0].uuid) {
            let options = Object.keys(CONFIG.DND5E.damageTypes).filter(t => args[0].item.system.description.value.toLowerCase().includes(t)).map((t) => { return `<option value="${t}">${t.charAt(0).toUpperCase() + t.toLowerCase().slice(1)}</option>` });
            let content = `
            <div class="form-group">
                <label>Damage Types: </label>
                <select name="types"}>${options}</select>
            </div>
            `;
            let typeDialog = await new Promise((resolve) => {
                new Dialog({
                    title: `${args[0].item.name}: Choose Damage Type`,
                    content: content,
                    buttons: {
                        Confirm: {
                            label: "Confirm",
                            icon: '<i class="fas fa-check"></i>',
                            callback: async () => {resolve($("[name=types]")[0].value)},
                        },
                    },
                    default: "Cancel",
                    close: () => {resolve($("[name=types]")[0].value)}
                }).render(true);
            });
            let type = await typeDialog;
            workflowNext.defaultDamageType = type;
            let newDamageRoll = workflowNext.damageRoll;
            newDamageRoll.terms.forEach(t => { 
                t.options.flavor = type;
                t.formula.replace(t.options.flavor, type);
            });
            await args[0].workflow.setDamageRoll(newDamageRoll);
            Hooks.off("midi-qol.preDamageRollComplete", hook1);
        }
    });
    let hook2 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
        if (workflowNext.uuid == args[0].uuid) {
            Hooks.off("midi-qol.preDamageRollComplete", hook1);
            Hooks.off("midi-qol.preItemRoll", hook2);
        }
    });
} catch (err) {console.error("Choose Damage Type Macro - ", err)}