const lastArg = args[args.length - 1];
let tokenOrActor = await fromUuid(lastArg.actorUuid);
let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "DamageBonus" && lastArg.hitTargetUuids.length > 0 && ["mwak","rwak","msak","rsak"].includes(args[0].itemData.data.actionType)) {
    const target = await fromUuid(lastArg.hitTargetUuids[0]);
    const tactorTarget = target.actor ? target.actor : target;
    let surprised = tactorTarget.effects.find(i => ["Surprised"].includes(i.data.label));
    if (surprised) {
        const diceMult = args[0].isCritical ? 2: 1;
        const baseDice = 3;
        const damageType = args[0].item.data.damage.parts[0][1];
        return {damageRoll: `${baseDice * diceMult}d6[${damageType}]`, flavor: "Surprise Attack"};
    }
}