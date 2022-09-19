// relentless endurance world macro

Hooks.on("midi-qol.RollComplete", async (workflow) => {
    let attackWorkflow = workflow?.damageList?.map((i) => ({ tokenUuid: i?.tokenUuid, appliedDamage: i?.appliedDamage, newHP: i?.newHP, oldHP: i?.oldHP }));
    if (!attackWorkflow) return;
    attackWorkflow.forEach( async (a) => {
        let tokenOrActor = await fromUuid(a?.tokenUuid);
        let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
        let featItem = await tactor.items.find(i => i.name === "Relentless Endurance");
        if (!featItem || !featItem.data.data.uses.value || featItem.data.data.uses.value === 0 || a?.oldHP < 1) return;
        if (a?.appliedDamage > 0 && a?.newHP < 1 && a?.appliedDamage <= damageThreshold && a?.appliedDamage < tactor.data.data.attributes.hp.max + tactor.data.data.attributes.hp.value) {
            tactor.update({"data.attributes.hp.value" : 1});
            featItem.update({"data.uses.value" : featItem.data.data.uses.value - 1});
        }
    }); 
});