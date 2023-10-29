// magical ambush
// effect on use pre save

if (args[0].macroPass === "preSave" && args[0].actor.data.flags["midi-qol"].hidden && args[0].hitTargets.length && args[0].item.type === "spell" && args[0].item.data.save.dc) {
    for (let t = 0; t < args[0].hitTargets.length; t++) {
        let token = args[0].hitTargets[t];
        let tactor = token.actor;
        if (args[0].token.data.disposition === token.data.disposition || !tactor || args[0].actor.data.flags["midi-qol"].hidden <= tactor.data.data.skills.prc.passive) continue;
        let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
            if (actor === tactor && abilityId === args[0].item.data.save.ability) {
                rollData.disadvantage = true;
                Hooks.off("Actor5e.preRollAbilitySave", hook);
            }
        });
    }
}