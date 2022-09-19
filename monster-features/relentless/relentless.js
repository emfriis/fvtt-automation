// relentless world macro

Hooks.on("midi-qol.preApplyDynamicEffects", async (workflow) => {
    let attackWorkflow = workflow?.damageList?.map((i) => ({ tokenUuid: i?.tokenUuid, appliedDamage: i?.appliedDamage, newHP: i?.newHP, oldHP: i?.oldHP }));
    if (!attackWorkflow) return;
    for (let a = 0; a < attackWorkflow.length; a++) {
        let tokenOrActor = await fromUuid(attackWorkflow[a]?.tokenUuid);
        let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
        let featItem = await tactor.items.find(i => i.name === "Relentless");
        let damageThreshold = getProperty(tactor.data.flags, "midi-qol.relentlessThreshold");
        if (!featItem || !featItem.data.data.uses.value || featItem.data.data.uses.value === 0 || !damageThreshold || attackWorkflow[a]?.oldHP < 1) return;
        if (attackWorkflow[a]?.appliedDamage > 0 && attackWorkflow[a]?.newHP < 1 && attackWorkflow[a]?.appliedDamage <= damageThreshold) {
            tactor.update({"data.attributes.hp.value" : 1});
            featItem.update({"data.uses.value" : featItem.data.data.uses.value - 1});
        }
    }; 
});