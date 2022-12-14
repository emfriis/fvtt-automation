// forceful hand
// on use

const tokenOrActor = await fromUuid(args[0]?.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

if (args[0].tag === "OnUse" && args[0].item.name) {
	const targetToken = args[0].targets[0];
	const target = targetToken.actor;

    const sourcePlayer = await playerForActor(tactor);
	const targetPlayer = await playerForActor(target);

    let sourceRoll;
    if (["md", "sm", "tiny"].includes(target.data.data.traits.size)) {
	    sourceRoll = await MidiQOL.socket().executeAsUser("rollAbility", sourcePlayer.id, { request: "skill", targetUuid: tactor.uuid, ability: "ath", options: { chatMessage: true, fastForward: true, advantage: true } });
    } else {
        sourceRoll = await MidiQOL.socket().executeAsUser("rollAbility", sourcePlayer.id, { request: "skill", targetUuid: tactor.uuid, ability: "ath", options: { chatMessage: true, fastForward: true } });
    }
	const targetRoll = await MidiQOL.socket().executeAsUser("rollAbility", targetPlayer.id, { request: "skill", targetUuid: target.uuid, ability: "ath", options: { chatMessage: true, fastForward: true } });
	
	if (sourceRoll.total > targetRoll.total) {
        ChatMessage.create({ content: `The attacker wins the contest and shoves the target back ${Math.max(tactor.data.flags.spellmod * 5), 5} feet.` });
	} else {
        ChatMessage.create({ content: "The attacker loses the contest." });
    }
}