// petrifying gaze (aura)
// effect itemacro

// aura each turn start can avert gaze if not roll source item at tactor
// effect each turn start make save if fail petrify
// effect has aura applied only to self and restrained effect applied only to target

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users.find(u => u.data.character === actor.id && u.active);
	if (!user) user = game.users.players.find(p => p.active && actor.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users.find(p => p.isGM && p.active);
	return user;
}

async function canSee(token, target) {
    let canSeeCV = game.modules.get('conditional-visibility')?.api?.canSee(token, target);
    let canSeeLos = _levels?.advancedLosTestVisibility(token, target);
    let canSeeLight = true;
    let inLight = _levels?.advancedLOSCheckInLight(target);
    if (!inLight) {
        let vision = Math.min((token.data.flags["perfect-vision"].sightLimit ? token.data.flags["perfect-vision"].sightLimit : 9999), Math.max(token.data.dimSight, token.data.brightSight));
        if (vision < MidiQOL.getDistance(token, target, false)) canSeeLight = false;
    }
    let canSee = canSeeCV && canSeeLos && canSeeLight;
    return canSee;
}

if (args[0] === "each") {
    if (lastArg.efData.label === "Petrifying Gaze") {
        let item;
        if (lastArg.efData.origin) item = await fromUuid(lastArg.efData.origin);
        if (!item) return;
        let caster = item.parent;
        if (!caster || !caster.token || !canSee(token, caster.token)) return;
        let player = await playerForActor(tactor);
        let avertGaze = false;
        avertGaze = await USF.socket.executeAsUser("useDialog", player.id, { title: `Petrifying Gaze`, content: `Avert your gaze?` });
        if (avertGaze) {
            const effectData = {
                changes: [{ key: `flags.midi-qol.onUseMacroName`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `PetrifyingGaze, preAttackRoll`, priority: 20, }],
                disabled: false,
                label: "Averted Gaze",
                icon: "icons/magic/control/hypnosis-mesmerism-eye.webp",
                flags: { dae: { itemData: item.data, specialDuration: ["turnStart"] }, core: { statusId: "Averted Gaze" } },
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
        } else {

        }
    } else if (lastArg.efData.label === "Restrained") {
        
    }
}

if (args[0].tag === "OnUse" && lastArg.macroPass === "preAttackRoll") {
    const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    attackWorkflow.disadvantage = true;
}