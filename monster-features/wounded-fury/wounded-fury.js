let tokenOrActor = await fromUuid(args[0].actorUuid);
let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (tactor.data.data.attributes.hp.value > 10) return;

if (args[0].tag === "OnUse" && ["mwak","rwak","msak","rsak"].includes(args[0].itemData.data.actionType)) {
    const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    attackWorkflow.advantage = true;
}

if (args[0].tag === "DamageBonus" && args[0].hitTargetUuids.length > 0 && ["mwak","msak"].includes(args[0].itemData.data.actionType)) {
    const diceMult = args[0].isCritical ? 2: 1;
    const baseDice = 2;
    const damageType = args[0].item.data.damage.parts[0][1];
    return {damageRoll: `${baseDice * diceMult}d6[${damageType}]`, flavor: "Wounded Fury"};
}