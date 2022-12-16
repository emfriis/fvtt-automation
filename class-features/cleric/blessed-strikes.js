if((args[0].tag === "DamageBonus") && ((args[0].hitTargets.length > 0) || (args[0].failedSaves.legnth > 0))){    
	let tokenD = canvas.tokens.get(args[0].tokenId);
	let weapons = tokenD.actor.itemTypes.weapon.filter(i=> i.hasDamage).map(i=> i.name.toLowerCase());
	let spells = tokenD.actor.itemTypes.spell.filter(i=> i.hasDamage && i.data.data.level === 0).map(i=> i.name.toLowerCase());
	let attackList = weapons.concat(spells);
    let itemD = args[0].item;
	let legalAttack = attackList.some(i => (itemD.name).toLowerCase().includes(i));
    if(!legalAttack) return {};    
    let damageType = "radiant";
    let numDice = 1;	
    let originD = tokenD.actor.items.find(i=> i.name === "Blessed Strikes");    
	let effect = tokenD.actor.effects.find(i=> i.data.label === `${originD.name} Attack`);
	if(effect) return {};
	let damageRoll = new game.dnd5e.dice.DamageRoll(`${numDice}d8[${damageType}]`, {},  {critical: args[0].isCritical}).evaluate({async:false});    
    let gameRound = game.combat ? game.combat.round : 0;
    let effectData = {
      label : `${originD.name} Attack`,
      icon : originD.img,
      tint : "#8f0000",
      origin: originD.uuid,
      duration: {turns: 1, startRound: gameRound, startTime: game.time.worldTime}
    };	
	await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tokenD.actor.uuid, effects: [effectData] });    
    return { damageRoll: damageRoll.formula, flavor: `(${originD.name} (${CONFIG.DND5E.damageTypes[damageType]}))` };
}