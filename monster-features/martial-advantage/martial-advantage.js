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
      const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn /100}`;
      const lastTime = actor.getFlag("midi-qol", "martialAdvantageTime");
      if (combatTime === lastTime) {
       MidiQOL.warn("Already used martial advantage this turn");
       return {};
      }
    }
    let isAdv = false;
    
    if (!isAdv) {
      let nearbyAlly = canvas.tokens.placeables.filter(t => {
        let nearby = (
			t.actor &&
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
    if (!isAdv) {
      MidiQOL.warn("Martial Advantage Attack: No ally next to target");
      return {};
    }
	let dialog = new Promise((resolve, reject) => {
	  new Dialog({
	  // localize this text
	  title: "Conditional Damage",
	  content: `<p>Use Martial Advantage?</p>`,
	  buttons: {
		  one: {
			  icon: '<i class="fas fa-check"></i>',
			  label: "Confirm",
			  callback: () => resolve(true)
		  },
		  two: {
			  icon: '<i class="fas fa-times"></i>',
			  label: "Cancel",
			  callback: () => {resolve(false)}
		  }
	  },
	  default: "two",
	  close: callBack => {resolve(false)}
	  }).render(true);
	});
	useAdv = await dialog;
    if (!useAdv) return {}
    const diceMult = args[0].isCritical ? 2: 1;
    const baseDice = 2;
  	const damageType = args[0].item.data.damage.parts[0][1];
    if (game.combat) {
      const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn /100}`;
      const lastTime = actor.getFlag("midi-qol", "martialAdvantageTime");
      if (combatTime !== lastTime) {
         await actor.setFlag("midi-qol", "martialAdvantageTime", combatTime)
      }
    }
    // How to check that we've already done one this turn?
    return {damageRoll: `${baseDice * diceMult}d6[${damageType}]`, flavor: "Martial Advantage"};
} catch (err) {
    console.error(`${args[0].itemData.name} - Martial Advantage Attack ${version}`, err);
}