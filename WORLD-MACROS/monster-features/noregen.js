// no regen world macro

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

Hooks.on("midi-qol.preApplyDynamicEffects", async (workflow) => {
    try {
        let attackWorkflow = workflow?.damageList?.map((i) => ({ tokenUuid: i?.tokenUuid, appliedDamage: i?.appliedDamage, newHP: i?.newHP, oldHP: i?.oldHP, damageDetail: i?.damageDetail }));
        if (!attackWorkflow) return;
        for (let a = 0; a < attackWorkflow.length; a++) {
            let tokenOrActor = await fromUuid(attackWorkflow[a]?.tokenUuid);
            if (!tokenOrActor) return;
            let tactor = tokenOrActor?.actor ? tokenOrActor?.actor : tokenOrActor;
            let noRegenTypes = tactor.data.flags["midi-qol"]?.noregen?.split(",");
            if (!noRegenTypes) continue;
        } 
    } catch(err) {
        console.error(`no regen macro error`, err);
    }
});