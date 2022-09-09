// Open up the Special Traits window on your Cleric's sheet, then locate DAE.Midi-QOL Specific Bonus Damage Macros. There enter the name of the macro, whatever you named it.
if ((args[0].tag === "DamageBonus") && (args[0].hitTargets.length > 0)) {
    let tokenD = canvas.tokens.get(args[0].tokenId);
    let attackList = tokenD.actor.itemTypes.weapon.filter(i => i.hasDamage).map(i => i.name.toLowerCase());      
    let itemD = args[0].item;
    let legalAttack = attackList.some(i => (itemD.name).toLowerCase().includes(i));
    if (!legalAttack) return {};
    let originD = tokenD.actor.items.getName("Divine Strike");
    let effect = tokenD.actor.effects.find(i=> i.data.label === `${originD.name} Attack`);
    if(effect) return {};
    let level = tokenD.actor.classes.cleric?.data.data.levels || tokenD.actor.data.data.details?.cr;
    let damageType = "radiant";
    let numDice = level >= 14 ? 2 : 1;
    let damageRoll = new game.dnd5e.dice.DamageRoll(`${numDice}d8[${damageType}]`, {}, { critical: args[0].isCritical }).evaluate({ async: false });
    let gameRound = game.combat ? game.combat.round : 0;
    let effectData = {
        label: `${originD.name} Attack`,
        icon: originD.img,
        tint: "#8f0000",
        origin: originD.uuid,
        duration: { turns: 1, startRound: gameRound, startTime: game.time.worldTime }
    };
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tokenD.actor.uuid, effects: [effectData] });
    return { damageRoll: damageRoll.formula, flavor: `(${originD.name} (${CONFIG.DND5E.damageTypes[damageType]}))` };
}