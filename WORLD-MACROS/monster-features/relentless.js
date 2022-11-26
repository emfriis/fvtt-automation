// relentless world macro

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

Hooks.on("midi-qol.preApplyDynamicEffects", async (workflow) => {
    try {
        let attackWorkflow = workflow?.damageList?.map((i) => ({ tokenUuid: i?.tokenUuid, appliedDamage: i?.appliedDamage, newHP: i?.newHP, oldHP: i?.oldHP }));
        if (!attackWorkflow) return;
        for (let a = 0; a < attackWorkflow?.length; a++) {
            let tokenOrActor = await fromUuid(attackWorkflow[a]?.tokenUuid);
            if (!tokenOrActor) continue;
            let tactor = tokenOrActor?.actor ? tokenOrActor?.actor : tokenOrActor;
            if (!tactor) continue;
            let featItem = await tactor.items.find(i => i.name === "Relentless");
            let damageThreshold = Math.ceil(tactor.data.data.details?.cr * 2 + 6);
            if (!featItem || !featItem.data.data.uses.value || featItem.data.data.uses.value === 0 || !damageThreshold || attackWorkflow[a]?.oldHP < 1) continue;
            if (attackWorkflow[a]?.appliedDamage > 0 && attackWorkflow[a]?.newHP < 1 && attackWorkflow[a]?.appliedDamage <= damageThreshold) {
                tactor.update({"data.attributes.hp.value" : 1});
                featItem.update({"data.uses.value" : featItem.data.data.uses.value - 1});
            }
        }
    } catch(err) {
        console.error(`relentless macro error`, err);
    }
});