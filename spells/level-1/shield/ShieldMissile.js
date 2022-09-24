// shield spell to block magic missile
// hooks on - preamble complete - offer dialog to cast shield spell
// hooks on - pre damage application - reduce attack damage to zero

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

Hooks.on("midi-qol.preableComplete", async (workflow) => {
    let workflowTargets = Array.from(workflow?.targets);
    if (!workflowTargets) return;
    for (let t = 0; t < attackWorkflow.length; t++) {
        let token = workflowTargets[t];
        let tactor = token?.actor;
        if (!tactor || !tactor.items.find(i => i.name === "Shield" && i.data.type === "spell") || tactor.effects.find(e => e.data.label === "Reaction" || e.data.label === "Incapacitated")) return;
        // use midi-qol reaction dialog?
        // or custom spell dialog?
        // also need to check if has valid spell slot
    }; 
});

Hooks.on("midi-qol.preDamageRollComplete", async (workflow) => {
    if (workflow.itemData.name !== "Magic Missile") return;
    let workflowTargets = Array.from(workflow?.targets);
    if (!workflowTargets) return;
    for (let t = 0; t < workflowTargets.length; t++) {
        let tokenOrActor = await fromUuid(workflowTargets[t]?.tokenUuid);
        let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
        if (!tactor.effects.find(i => i.data.label === "Shield")) return;
        // reduce damage to zero
    }; 
});