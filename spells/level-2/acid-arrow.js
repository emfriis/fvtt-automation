// acid arrow
// on use post attack
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.macroPass === "postAttackRoll") {
    let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
    lastArg.targets.forEach( async t => {
        if (lastArg.hitTargets.find(h => h.id === t.id)) {
            if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, t.id, `${lastArg.spellLevel + 2}d4`, "acid", "magiceffect", "spelleffect");
        } else {
            if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, t.id, `${lastArg.spellLevel + 2}d4`, "acid", "magiceffect", "spelleffect");
        }
    });
}

if (args[0] === "off" && lastArg["expiry-reason"] === "times-up:duration-special") {
    let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
    if (applyDamage) await applyDamage.execute("ApplyDamage", t.id, t.id, `${args[1]}d4`, "acid", "magiceffect", "spelleffect");
}