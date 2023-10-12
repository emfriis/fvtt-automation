args[0].workflow.newDefaultDamageType = type;
let hook1 = Hooks.on("midi-qol.preDamageRollComplete", async workflowNext => {
    if (workflowNext.uuid === args[0].uuid) {
        workflowNext.defaultDamageType = type;
        workflowNext.damageRoll.dice.forEach((d) => { 
            if (options.includes(d.flavor)) {
                d.flavor = type;
                d.options.flavor = type;
                d.formula.replace(d.options.flavor, type);
            }
        });
        workflowNext.damageRollHTML = await workflowNext.damageRoll.render();
        Hooks.off("midi-qol.preDamageRollComplete", hook1);
    }
});
let hook2 = Hooks.on("midi-qol.RollComplete", async workflowNext => {
    if (workflowNext.uuid === args[0].uuid) {
        Hooks.off("midi-qol.preDamageRollComplete", hook1);
        Hooks.off("midi-qol.RollComplete", hook2);
    }
});