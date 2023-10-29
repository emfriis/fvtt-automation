// ki-empowered strikes
// effect on use post targeting

try {
    if (args[0].tag !== "DamageBonus" && args[0].itemData.data.actionType === "mwak" && args[0].item.name.toLowerCase().includes("unarmed strike")) {
        const workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
        if (workflow.item.type !== "weapon" || workflow.item.data.data?.properties?.mgc) return;
        workflow.item.update({ "data.properties.mgc" : true });
        let hook1 = Hooks.on("midi-qol.RollComplete", async workflowNext => {
            if (workflowNext.uuid === args[0].uuid) {
                workflow.item.update({ "data.properties.mgc" : false });
                Hooks.off("midi-qol.RollComplete", hook1);
                Hooks.off("midi-qol.preItemRoll", hook2);
            }
        });
        let hook2 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
            if (workflowNext.uuid === args[0].uuid) {
                workflow.item.update({ "data.properties.mgc" : false });
                Hooks.off("midi-qol.RollComplete", hook1);
                Hooks.off("midi-qol.preItemRoll", hook2);
            }
        });
    }
} catch (err) {
    console.error("Ki-Empowered Strikes macro error", err);
};