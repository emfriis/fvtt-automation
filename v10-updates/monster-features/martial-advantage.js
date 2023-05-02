try {
    const attacker = canvas.tokens.get(args[0].tokenId); 
    const target = canvas.tokens.get(args[0].hitTargets[0].id);
    if (!attacker.actor || !["mwak","rwak"].includes(args[0].item.system.actionType) || !args[0].hitTargets.length) return; // abort if not weapon attack or no hit targets
    if (!game.canvas.tokens.placeables.find(t => t.actor && !((t.actor.system.details.type.value === "custom" || t.actor.system.details.type.value === "") && t.actor.system.details.type.custom === "") && t.id !== attacker.id && t.id !== target.id && attacker.disposition === t.disposition && t.actor.system.attributes.hp.value > 0 && !(t.actor.effects.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.data.label))) && MidiQOL.getDistance(t, target, false) <= 5)) return; // abort if no nearby ally
    if (game.combat) {
      const advTime = `${game.combat.id} - ${game.combat.round + game.combat.turn / 100}`;
      const lastTime = actor.getFlag("midi-qol", "martialAdvantageTime");
      if (advTime === lastTime) return; // abort if already used this turn
      await attacker.actor.setFlag("midi-qol", "martialAdvantageTime", advTime); // flag as already used this turn
    }
    const diceMult = args[0].isCritical ? 2 : 1;
    return {damageRoll: `${2 * diceMult}d6`, flavor: "Martial Advantage"};
} catch (err) {
    console.error(`Martial Advantage error`, err);
}