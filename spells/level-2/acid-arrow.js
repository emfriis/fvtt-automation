// acid arrow
// on use post attack
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.macroPass === "postDamageRoll") {
    for (let t = 0; t < lastArg.targetUuids.length; t++) {
        if (!lastArg.hitTargetUuids.includes(lastArg.targetUuids[t])) {
            let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
            if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, lastArg.targets[t].id, Math.floor(lastArg.damageDetail[0].damage / 2), "acid", "magiceffect", "spelleffect");
        }
    }
}

if (args[0] === "off" && ["times-up:duration-special","times-up:duration:turns"].includes(lastArg["expiry-reason"])) {
    let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
    if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, lastArg.tokenId, `${args[1]}d4`, "acid", "magiceffect", "spelleffect");
}