// wail
// on use pre effects

const lastArg = args[args.length - 1];

if (args[0].tag === "OnUse" && lastArg.macroPass === "preActiveEffects") {
    for (let t = 0; t < lastArg.hitTargets.length; t++) {
        let target = lastArg.hitTargets[t];
        if (["undead","construct"].some(type => (target?.actor?.data?.data?.details?.type?.value ?? target?.actor?.data?.data?.details?.race)?.toLowerCase()?.includes(type))) continue;
        if (lastArg.failedSaves.includes(target)) {
            await USF.socket.executeAsGM("updateActor", { actorUuid: target?.actor?.uuid, updates: {"data.attributes.hp.value" : 0} });
        } else {
            let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
            if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, target.id, "3d6", "psychic", "magiceffect");
        }
    }
}