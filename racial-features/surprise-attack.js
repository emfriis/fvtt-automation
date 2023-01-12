// surprise attack
// damage bonus

const lastArg = args[args.length - 1];
let tokenOrActor = await fromUuid(lastArg.actorUuid);
let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "DamageBonus" && lastArg.hitTargetUuids.length > 0 && ["mwak","rwak","msak","rsak"].includes(args[0].itemData.data.actionType)) {
    let isSurprise = game.combat && game.combat.round === 1 && game.combat.combatants.find(c => lastArg.hitTargetUuids[0] === c.token.uuid).initiative < game.combat.combatants.find(c => lastArg.tokenUuid === c.token.uuid).initiative;
    if (isSurprise) {
        const diceMult = args[0].isCritical ? 2: 1;
        const baseDice = 2;
        const damageType = args[0].item.data.damage.parts[0][1];
        return {damageRoll: `${baseDice * diceMult}d6[${damageType}]`, flavor: "Surprise Attack"};
    }
}