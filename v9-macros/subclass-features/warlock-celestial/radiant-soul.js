// radiant soul
// damage bonus

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "DamageBonus" && args[0].item.type === "spell" && args[0].item.data.damage.parts.length > 0) {
    const validTypes = ["fire","radiant"];
    let damageType;
    args[0].item.data.damage.parts.forEach(part => {
        if (!validTypes.includes(part[1].toLowerCase())) return;
        damageType = part[1];
    });
    if (!damageType) return;
    return {damageRoll: `${tactor.data.data.abilities.cha.mod}[${damageType}]`, flavor: "Radiant Soul"}
}