// grapple

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

if (args[0].tag === "OnUse") {
	const token = canvas.tokens.get(args[0].tokenId);
	const tokenOrActor = await fromUuid(args[0].actorUuid);
	const source = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

	const targetToken = args[0].targets[0];
	const target = targetToken.actor;

	const sizeMap = { grg: 5, huge: 4, lg: 3, md: 2, sm: 1, tiny: 0 }
	if (sizeMap[source.data.data.details.size] + 1 < sizeMap[target.data.data.details.size]) {
		ui.notifications.warn("Target is too large to grapple");
		return;
	}

	const sourcePlayer = await playerForActor(source);
	const targetPlayer = await playerForActor(target);

	let socket;
	if (game.modules.get("user-socket-functions")?.active) socket = socketlib.registerModule("user-socket-functions");
	if (!socket) return;

	let useAcr = await socket.executeAsUser("useDialog", targetPlayer.id, { title: `Grapple`, content: `Use Acrobatics instead of Athletics to constest grapple?` });
	const skillType = useAcr ? "acr" : "ath";

	const sourceRoll = await MidiQOL.socket().executeAsUser("rollAbility", sourcePlayer.id, { request: "skill", targetUuid: source.uuid, ability: "ath", options: { chatMessage: true, fastForward: true } });
	const targetRoll = await MidiQOL.socket().executeAsUser("rollAbility", targetPlayer.id, { request: "skill", targetUuid: target.uuid, ability: skillType, options: { chatMessage: true, fastForward: true } });
	
	if (sourceRoll.total > targetRoll.total) {
		const effectData = {
			changes: [
				{ key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Grappled", priority: 20, },
				{ key: "macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `Grapple ${token.id}`, priority: 20, }
			],
            disabled: false,
            label: "Grappled",
			flags: { dae: { macroRepeat: "startEveryTurn" } }
		}
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.uuid, effects: [effectData] });
        ChatMessage.create({ content: "The attacker wins the contest and grapples the target." });
	} else {
        ChatMessage.create({ content: "The attacker loses the contest." });
    }
}


if (args[0] === "each") {
	const lastArg = args[args.length - 1];

	const tokenOrActorTarget = await fromUuid(lastArg.actorUuid);
	const target = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;

	const tokenSource = canvas.tokens.get(args[1]);
	const source = tokenSource.actor;

	const sourcePlayer = await playerForActor(source);
	const targetPlayer = await playerForActor(target);

	let socket;
	if (game.modules.get("user-socket-functions")?.active) socket = socketlib.registerModule("user-socket-functions");
	if (!socket) return

	let contest = await socket.executeAsUser("useDialog", targetPlayer.id, { title: `Grapple`, content: `Use your action to contest grapple?` });
	if (!contest) return;

	let useAcr = await socket.executeAsUser("useDialog", targetPlayer.id, { title: `Grapple`, content: `Use Acrobatics instead of Athletics to constest grapple?` });
	const skillType = useAcr ? "acr" : "ath";
	
	const sourceRoll = await MidiQOL.socket().executeAsUser("rollAbility", sourcePlayer.id, { request: "skill", targetUuid: source.uuid, ability: "ath", options: { chatMessage: true, fastForward: true } });
	const targetRoll = await MidiQOL.socket().executeAsUser("rollAbility", targetPlayer.id, { request: "skill", targetUuid: target.uuid, ability: skillType, options: { chatMessage: true, fastForward: true } });
	
	if (targetRoll.total > sourceRoll.total) {
		await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: target.uuid, effects: [lastArg.efData._id] });
        ChatMessage.create({ content: "The grappled creature wins the contest and removes the grappled condition." });
	} else if (targetRoll.total <= sourceRoll.total) {
        ChatMessage.create({ content: "The grappled creature loses the contest." });
    }
}