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

if (args[0] === "each" && lastArg.efData.disabled === false) {
    if (canSee(token, sourceToken)) return;
    const spellDC = args[2];
    const ability = "wis";
    const save = await USF.socket.executeAsGM("attemptSaveDC", { actorUuid: lastArg.actorUuid, saveName: `${lastArg.efData.label} Save`, saveImg: lastArg.efData.icon, saveType: "save", saveDC: spellDC, saveAbility: ability, magiceffect: true, spelleffect: true });
    if (save) {
        let fear = tactor.effects.find(i => i.data === lastArg.efData);
		if (fear) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [fear.id] });
    }
}