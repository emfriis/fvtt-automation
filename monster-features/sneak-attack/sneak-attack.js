// sneak attack
// requires MIDI-QOL

try {
    if (!["mwak","rwak"].includes(args[0].itemData.data.actionType) || args[0].disadvantage) return {}; // weapon attack
    if (args[0].itemData.data.actionType === "mwak" && !args[0].itemData.data.properties?.fin) 
      return {}; // ranged or finesse
    if (args[0].hitTargets.length < 1) return {};
    token = canvas.tokens.get(args[0].tokenId);
    actor = token.actor;
    if (!actor || !token || args[0].hitTargets.length < 1) return {};
    let target = canvas.tokens.get(args[0].hitTargets[0].id ?? args[0].hitTargers[0]._id);
    if (!target) MidiQOL.error("Sneak attack macro failed");
    
    if (game.combat) {
      const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn /100}`;
      const lastTime = actor.getFlag("midi-qol", "sneakAttackTime");
      if (combatTime === lastTime) {
       MidiQOL.warn("Sneak Attack Damage: Already done a sneak attack this turn");
       return {};
      }
    }
    let isAdv = args[0].advantage;

    let nearbyEnemy = false;
    if (!isAdv) {
      nearbyEnemy = canvas.tokens.placeables.find(t => 
        t.actor &&
        t.actor?.uuid !== args[0].actorUuid && // not me
        t.actor.uuid !== target.actor.uuid && // not the target
        t.actor.data.data.attributes?.hp.value > 0 && // not dead or unconscious
        !(t.actor?.effects.find(i => i.data.label === "Incapacitated" || i.data.label === "Unconscious" || i.data.label === "Paralyzed" || i.data.label === "Petrified")) && // not incapacitated
        t.data.disposition === token.data.disposition && // an ally of the attacker
        MidiQOL.getDistance(t, target, false) <= 5 // close to the target
      );
    }

    if (!isAdv && !nearbyEnemy) {
      MidiQOL.warn("Sneak Attack Damage: No advantage/ally next to target");
      return {};
    }

    const diceMult = args[0].isCritical ? 2: 1;
    const baseDice = Math.ceil(actor.data.data.details.cr / 2);
	const damageType = args[0].item.data.damage.parts[0][1];
    if (game.combat) {
      const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn /100}`;
      const lastTime = actor.getFlag("midi-qol", "sneakAttackTime");
      if (combatTime !== lastTime) {
         await actor.setFlag("midi-qol", "sneakAttackTime", combatTime)
      }
    }
    return {damageRoll: `${baseDice * diceMult}d6[${damageType}]`, flavor: "Sneak Attack"};
} catch (err) {
    console.error(`${args[0].itemData.name} - Sneak Attack}`, err);
}