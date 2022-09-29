// armor of agathys world macro

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

Hooks.on("midi-qol.preApplyDynamicEffects", async (workflow) => {
    let attackWorkflow = workflow?.damageList?.map((i) => ({ tokenUuid: i?.tokenUuid, appliedDamage: i?.appliedDamage, newHP: i?.newHP, oldHP: i?.oldHP }));
    if (!attackWorkflow) return;
    for (let a = 0; a < attackWorkflow?.length; a++) {
        
    }; 
});