try {
    if (args[0].macroPass != "postDamageRoll" || (!args[0].hitTargets.length && MidiQOL.configSettings().autoRollDamage == "always") || !args[0].damageRoll || !["mwak", "rwak"].includes(args[0].item.system.actionType) || args[0].disadvantage || (game.combat && args[0].actor.effects.find(e => e.label === "Used Sneak Attack")) || !(args[0].advantage || canvas.tokens.placeables.find(t=> t.actor && !((t.actor.system.details?.type?.value === "custom" || t.actor.system.details?.type?.value === "") && t.actor.system.details?.type?.custom === "") && t.id !== args[0].workflow.token.id && t.id !== args[0].targets[0].id && t.disposition === args[0].workflow.token.disposition && t.actor.system.attributes?.hp.value > 0 && !MidiQOL.checkIncapacitated(t.actor) && MidiQOL.computeDistance(t, args[0].targets[0], false) < 10))) return;
    if (game.combat) {
        const effectData = {
            disabled: false,
            duration: { turns: 1 },
            label: "Used Sneak Attack",
            icon: "icons/skills/melee/strike-dagger-arcane-pink.webp"
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    }
    const dice = +args[0].actor.flags["midi-qol"].sneakAttack ?? 1;
    const diceMult = args[0].isCritical ? 2 : 1;
    let bonusRoll = await new Roll('0 + ' + `${dice * diceMult}d6`).evaluate({async: true});
    if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
    for (let i = 1; i < bonusRoll.terms.length; i++) {
        args[0].damageRoll.terms.push(bonusRoll.terms[i]);
    }
    args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${dice * diceMult}d6`;
    args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
    await args[0].workflow.setDamageRoll(args[0].damageRoll);
    args[0].workflow.sneakAttack = true;
} catch (err) {console.error("Sneak Attack Macro - ", err)}