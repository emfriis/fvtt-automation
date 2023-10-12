let hook1 = Hooks.on("midi-qol.preDamageRollComplete", async workflowNext => {
    console.error(1, duplicate(workflowNext.damageRoll));
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
    if (workflowNext.itemCardId === args[0].workflow.itemCardId) {
        const chatMessage = game.messages.get(workflowNext.itemCardId);
        let content = duplicate(chatMessage.content);
        content = content.replace(/<div class="midi-qol-saves-display">[\s\S]*<div class="end-midi-qol-saves-display">/g, `<div class="midi-qol-saves-display"><div class="end-midi-qol-saves-display">Damage type changed to ${type} with Metamagic: Transmuted Spell`);
        chatMessage.update({ content: content });
        Hooks.off("midi-qol.preDamageRollComplete", hook1);
        Hooks.off("midi-qol.RollComplete", hook2);
    }
});