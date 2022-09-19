// uses handler of user-socket-functions - "useDialog"

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const item = await fromUuid(lastArg.efData.origin);

async function playerForActor(actor) {
	if (!actor)
		return undefined;
	let user;
	// find an active user whose character is the actor
	if (actor.hasPlayerOwner)
		user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) // no controller - find the first owner who is active
		user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	// if all else fails it's and active gm.
	if (!user)
		user = game.users?.find(p => p.isGM && p.active);
	return user;
}

async function attackCheck(workflow) {
    if (!["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) return;
    let shield = await tactor.items.find(i => i.data.data?.armor?.type === "shield" && i.data.data.equipped);
    let reactionUsed = await tactor.effects.find(e => e.data.label === "Reaction" || e.data.label === "Incapacitated")
    if (tactor.data.data.attributes.hp.value < 1 || !shield || reactionUsed) return;

    let tokenAttacker = canvas.tokens.get(workflow.tokenId);
    let canSeeAttacker = true;
    if (game.modules.get("conditional-visibility")?.active && game.modules.get("levels")?.active && _levels) { 
        canSeeAttacker = game.modules.get('conditional-visibility')?.api?.canSee(token, tokenAttacker) && _levels?.advancedLosTestVisibility(token, tokenAttacker);
    }
    if (!canSeeAttacker) return;

    let workflowTargets = Array.from(workflow?.targets);
    let player = await playerForActor(tactor);
    let socket = socketlib.registerModule("user-socket-functions");
    
    for (i = 0; i < workflowTargets.length; i++) {
        if (workflowTargets[i].id === token.id || MidiQOL.getDistance(workflowTargets[i], token, false) > 5 || workflowTargets[i].data.disposition !== token.data.disposition) return;
        let useProtect = false;
        if (game.modules.get("user-socket-functions")?.active) useProtect = await socket.executeAsUser("useDialog", player.id, { title: `${item.data.name}`, content: `Use your reaction to impose disadvantage on attack against ${workflowTargets[i].name}?` });
        if (useProtect) {
            await Object.assign(workflow, { disadvantage: true });
            const hasEffectApplied = game.dfreds.effectInterface.hasEffectApplied("Reaction", tokenOrActor.uuid );
            if (!hasEffectApplied) {
                await game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: tactor.uuid });
            }
            return;
        }
    }
}

if (args[0] === "each") { // start of turn macros always run on combat start
    const flag = await DAE.getFlag(tactor, "proHook");
    if (flag) {
        Hooks.off("midi-qol.preambleComplete", flag);
		await DAE.unsetFlag(tactor, "proHook");
    }
    let hookId = Hooks.on("midi-qol.preambleComplete", attackCheck);
    DAE.setFlag(tactor, "proHook", hookId);
}