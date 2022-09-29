// relentless endurance world macro
// uses handler of user-socket-functions - "useDialog"

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

Hooks.on("midi-qol.preApplyDynamicEffects", async (workflow) => {
    let attackWorkflow = workflow?.damageList?.map((i) => ({ tokenUuid: i?.tokenUuid, appliedDamage: i?.appliedDamage, newHP: i?.newHP, oldHP: i?.oldHP }));
    if (!attackWorkflow) return;
    for (let a = 0; a < attackWorkflow.length; a++) {
        let tokenOrActor = await fromUuid(attackWorkflow[a]?.tokenUuid);
        if (!tokenOrActor) return;
        let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
        if (!tactor) return;
        let featItem = await tactor.items.find(i => i.name === "Relentless Endurance");
        if (!featItem || !featItem.data.data.uses.value || featItem.data.data.uses.value === 0 || a?.oldHP < 1) return;
        if (attackWorkflow[a]?.appliedDamage > 0 && attackWorkflow[a]?.newHP < 1 && attackWorkflow[a]?.appliedDamage < tactor.data.data.attributes.hp.max + tactor.data.data.attributes.hp.value) {
            let player = await playerForActor(tactor);
		    let socket;
            if (game.modules.get("user-socket-functions")?.active) socket = socketlib.registerModule("user-socket-functions");
		    let useFeat = false;
            if (game.modules.get("user-socket-functions")?.active) useFeat = await socket.executeAsUser("useDialog", player.id, { title: `Relentless Endurance`, content: `Use Relentless Endurance to survive grievous wounds?` });
            if (useFeat) {
                tactor.update({"data.attributes.hp.value" : 1});
                featItem.update({"data.uses.value" : featItem.data.data.uses.value - 1});
                let uncon = tactor.effects.find(i => i.data.label === "Unconscious");
			    if (uncon) await tactor.deleteEmbeddedDocuments("ActiveEffect", [uncon.id]);
            }
        }
    }; 
});