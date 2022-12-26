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

async function attemptRemoval() {
    const spellDC = args[2];
    const ability = "wis";
    const itemData = {
        name: `${lastArg.efData.label} Save`,
        img: lastArg.efData.icon,
        type: "feat",
        flags: {
            midiProperties: { magiceffect: true, spelleffect: true, }
        },
        data: {
            activation: { type: "none", },
            target: { type: "self", },
            actionType: "save",
            save: { dc: spellDC, ability: ability, scaling: "flat" },
        }
    }
    await USF.socket.executeAsGM("createItem", { actorUuid: tactor.uuid, itemData: itemData });
    let saveItem = await tactor.items.find(i => i.name === itemData.name);
    let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
    await USF.socket.executeAsGM("deleteItem", { itemUuid: saveItem.uuid });
    
    if (!saveWorkflow.failedSaves.size) {
        let fear = tactor.effects.find(i => i.data === lastArg.efData);
		if (fear) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [fear.id] });
    }
}

if (args[0] === "each" && lastArg.efData.disabled === false) {
    if (token && sourceToken && !canSee(token, sourceToken)) { 
        attemptRemoval();
    }
}