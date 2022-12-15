// martial advantage

try {
    if (!["mwak","rwak"].includes(args[0].itemData.data.actionType)) return {}; // weapon attack
    if (args[0].hitTargets.length < 1) return {};
    token = canvas.tokens.get(args[0].tokenId);
    actor = token.actor;
    if (!actor || !token || args[0].hitTargets.length < 1) return {};
    let target = canvas.tokens.get(args[0].hitTargets[0].id ?? args[0].hitTargers[0]._id);
    if (!target) MidiQOL.error("Adv attack macro failed");
    
    if (game.combat) {
      const advTime = `${game.combat.id}-${game.combat.round + game.combat.turn /100}`;
      const lastTime = actor.getFlag("midi-qol", "martialAdvantageTime");
      if (advTime === lastTime) {
        MidiQOL.warn("Already used martial advantage this turn");
        return {};
      }
    }
    let isAdv = false;
    
    if (!isAdv) {
      let nearbyAlly = canvas.tokens.placeables.filter(t => {
        let nearby = (
          t.actor &&
          !(t.actor.data.data.details?.type?.value?.length < 3) && // is a creature
          t.actor?.uuid !== args[0].actorUuid && // not me
          t.actor?.id !== target.actor?.id && // not the target
          t.actor?.data.data.attributes?.hp?.value > 0 && // not dead or unconscious
          !(t.actor?.effects.find(i => i.data.label === "Incapacitated")) && // not incapacitated
          t.data.disposition === token.data.disposition && // an ally
          MidiQOL.getDistance(t, target, false) <= 5 // close to the target
        );
        return nearby;
      });
      isAdv = nearbyAlly.length > 0;
    }
    if (!isAdv) return;
    const diceMult = args[0].isCritical ? 2: 1;
    const baseDice = 2;
    const damageType = args[0].item.data.damage.parts[0][1];
    if (game.combat) {
      const advTime = `${game.combat.id}-${game.combat.round + game.combat.turn /100}`;
      const lastTime = actor.getFlag("midi-qol", "martialAdvantageTime");
      if (advTime !== lastTime) {
          await actor.setFlag("midi-qol", "martialAdvantageTime", advTime)
      }
    }
    // How to check that we've already done one this turn?
    return {damageRoll: `${baseDice * diceMult}d6[${damageType}]`, flavor: "Martial Advantage"};
} catch (err) {
    console.error(`${args[0].itemData.name} - Martial Advantage Attack ${version}`, err);
}