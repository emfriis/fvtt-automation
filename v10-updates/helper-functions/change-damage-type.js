args[0].workflow.newDefaultDamageType = type;
let hook1 = Hooks.on("midi-qol.preDamageRollComplete", async workflowNext => {
    if (workflowNext.uuid === args[0].uuid && workflowNext.newDefaultDamageType) {
        workflowNext.defaultDamageType = workflowNext.newDefaultDamageType;
        let newDamageRoll = workflowNext.damageRoll;
        newDamageRoll.terms.forEach(t => { 
            t.options.flavor = workflowNext.newDefaultDamageType;
            t.formula.replace(t.options.flavor, workflowNext.newDefaultDamageType);
        });
        await args[0].workflow.setDamageRoll(newDamageRoll);
        Hooks.off("midi-qol.preDamageRollComplete", hook1);
    }
});
let hook2 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
    if (workflowNext.uuid === args[0].uuid) {
        Hooks.off("midi-qol.preDamageRollComplete", hook1);
        Hooks.off("midi-qol.preItemRoll", hook2);
    }
});