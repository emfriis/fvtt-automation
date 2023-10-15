try {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    if (lastArg.tag === "DamageBonus" && lastArg.damageRoll && lastArg.item.system.actionType === "mwak") {
        const rageDamage = lastArg.actor.system.scale?.barbarian?.["rage-damage"] ?? 2;
        return { damageRoll: `${rageDamage}`, flavor: "Rage" }
    } else if (lastArg.tag === "OnUse" && lastArg.macroPass === "preAttackRoll") {

    } else if (args[0] === "") {

    } else if (args[0] === "each") {

    }
} catch (err) {console.error("Rage Macro - ", err)}