// no regen world macro

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

Hooks.on("midi-qol.preApplyDynamicEffects", async (workflow) => {
    try {
        let attackWorkflow = workflow?.damageList?.map((i) => ({ tokenUuid: i?.tokenUuid, damageDetail: i?.damageDetail }));
        if (!attackWorkflow) return;
        for (let a = 0; a < attackWorkflow.length; a++) {
            let tokenOrActor = await fromUuid(attackWorkflow[a]?.tokenUuid);
            if (!tokenOrActor) return;
            let tactor = tokenOrActor?.actor ? tokenOrActor?.actor : tokenOrActor;
            let noRegenTypes = tactor.data.flags["midi-qol"]?.noregen?.split(",");
            if (!noRegenTypes || noRegenTypes?.length === 0) continue;
            let damageDetail = attackWorkflow[a].damageDetail;
            console.warn(damageDetail);
            for (let d = 0; d < damageDetail?.length; d++) {
                for (let p = 0; p < damageDetail[d]?.length; p++) {
                    if (!noRegenTypes.includes(damageDetail[d][p]?.type)) continue;
                    const effectData = {
                        disabled: false,
                        flags: { dae: { specialDuration: ["turnEnd"], "core": { statusId: "No Regen" } } },
                        label: "No Regen",
                        icon: "icons/skills/wounds/blood-cells-vessel-red-orange.webp"
                    }
                    await tactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
                    return;
                }
            }
        } 
    } catch(err) {
        console.error(`no regen macro error`, err);
    }
});