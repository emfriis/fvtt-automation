// shove

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

if (args[0].tag === "OnUse") {
	const tokenOrActor = await fromUuid(args[0].actorUuid);
	const source = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

	const targetToken = args[0].targets[0];
	const target = targetToken.actor;

	const sizeMap = { grg: 5, huge: 4, lg: 3, md: 2, sm: 1, tiny: 0 }
	if (sizeMap[source.data.data.details.size] + 1 < sizeMap[target.data.data.details.size]) {
		ui.notifications.warn("Target is too large to shove");
		return;
	}

	const sourcePlayer = await playerForActor(source);
	const targetPlayer = await playerForActor(target);
	let socket;
	if (game.modules.get("user-socket-functions")?.active) socket = socketlib.registerModule("user-socket-functions");
	if (!socket) return;

	let useAcr = await socket.executeAsUser("useDialog", targetPlayer.id, { title: `Shove`, content: `Use Acrobatics instead of Athletics to constest shove?` });
	const skillType = useAcr ? "acr" : "ath";

	const sourceRoll = await MidiQOL.socket().executeAsUser("rollAbility", sourcePlayer.id, { request: "skill", targetUuid: source.uuid, ability: "ath", options: { chatMessage: true, fastForward: true } });
	const targetRoll = await MidiQOL.socket().executeAsUser("rollAbility", targetPlayer.id, { request: "skill", targetUuid: target.uuid, ability: skillType, options: { chatMessage: true, fastForward: true } });
	
	if (sourceRoll.total > targetRoll.total) {
        let prone = await socket.executeAsUser("useDialog", sourcePlayer.id, { title: `Shove`, content: `Shove target prone instead of back 5 feet?` });
        if (prone) {
            const effectData = {
                changes: [
                    { key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Prone", priority: 20, }
                ],
                disabled: false,
                label: "Prone",
            }
			await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.uuid, effects: [effectData] });
        }
        ChatMessage.create({ content: "The attacker wins the contest and shoves the target." });
	} else {
        ChatMessage.create({ content: "The attacker loses the contest." });
    }
}