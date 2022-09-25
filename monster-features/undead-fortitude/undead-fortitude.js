// undead fortitude world macro

Hooks.on("midi-qol.preApplyDynamicEffects", async (workflow) => {
    let attackWorkflow = workflow?.damageList?.map((i) => ({ tokenUuid: i?.tokenUuid, appliedDamage: i?.appliedDamage, newHP: i?.newHP, oldHP: i?.oldHP, damageDetail: i?.damageDetail }));
    if (!attackWorkflow) return;
    for (let a = 0; a < attackWorkflow.length; a++) {
        let tokenOrActor = await fromUuid(attackWorkflow[a]?.tokenUuid);
        let tactor = tokenOrActor?.actor ? tokenOrActor?.actor : tokenOrActor;
        if (!tactor) return;
        if (!tactor.items.find(i => i.name === "Undead Fortitude")) return;
        if (attackWorkflow[a]?.damageDetail.find(d => Array.isArray(d) && d[0]?.type === "radiant") || workflow?.isCritical || attackWorkflow[a]?.oldHP < 1 || attackWorkflow[a]?.newHP > 0) return;
        const rollOptions = { chatMessage: true, fastForward: true };
        const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: "save", targetUuid: tactor.uuid, ability: "con", options: rollOptions });
        if (game.dice3d) game.dice3d.showForRoll(roll);
        if (roll.total >= attackWorkflow[a]?.appliedDamage + 5) {
            tactor.update({"data.attributes.hp.value" : 1});
        }
    }; 
});