// fear
// effect itemacro

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const sourceToken = canvas.tokens.get(args[1]);

function canSee(token, target) {
    let canSeeCV = game.modules.get('conditional-visibility')?.api?.canSee(token, target);
    let canSeeLOS = _levels?.advancedLosTestVisibility(token, target);
    let canSeeLight = true;
    let inLight = _levels?.advancedLOSCheckInLight(target);
    if (!inLight) {
        let vision = Math.min((token.data.flags["perfect-vision"].sightLimit ? token.data.flags["perfect-vision"].sightLimit : 9999), Math.max(token.data.dimSight, token.data.brightSight));
	    if (vision < MidiQOL.getDistance(token, target, false)) canSeeLight = false;
    }
    let canSee = canSeeCV && canSeeLOS && canSeeLight;
    return canSee;
}

async function attemptRemoval(getResist) {
    const saveDC = args[2];
    const rollOptions = getResist ? { chatMessage: true, fastForward: true, advantage: true } : { chatMessage: true, fastForward: true };
    const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: "save", targetUuid: lastArg.actorUuid, ability: "wis", options: rollOptions });
    if (game.dice3d) game.dice3d.showForRoll(roll);
    if (roll.total >= saveDC) {
        let fear = tactor.effects.find(i => i.data === lastArg.efData);
		if (fear) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [fear.id] });
        ChatMessage.create({ content: `The afflicted creature passes the roll and removes the Frightened condition.` });
    } else {
        if (roll.total < saveDC) ChatMessage.create({ content: `The afflicted creature fails the roll and still has the Frightened condition.` });
    }
}

if (args[0] === "each" && lastArg.efData.disabled === false) {
    if (token && sourceToken && !canSee(token, sourceToken)) { 
        const getResist = tactor.data.flags["midi-qol"]?.resilience?.frightened || tactor.data.flags["midi-qol"]?.spellResistance || tactor.data.flags["midi-qol"]?.magicResistance?.all || tactor.data.flags["midi-qol"]?.magicResistance?.wis;
        attemptRemoval(getResist);
    }
}