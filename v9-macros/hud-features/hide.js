// hide

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].macroPass === "preambleComplete") {
    const player = await playerForActor(tactor);
    const stealthRoll = await MidiQOL.socket().executeAsUser("rollAbility", player.id, { request: "skill", targetUuid: tactor.uuid, ability: "ste", options: { chatMessage: true, fastForward: true } });
    if (tactor.data.flags["midi-qol"].hidden && tactor.data.flags["midi-qol"].hidden > stealthRoll.total) {
        return;
    } else {
        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: tactor.effects.filter(e => e.data.label === "Hidden").map(e => e.id) });
        const effectData = {
            changes: [
                { key: `flags.midi-qol.hidden`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: stealthRoll.total, priority: 20 },
                { key: `flags.midi-qol.onUseMacroName`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Hide, preAttackRoll", priority: 20 },
                { key: `flags.midi-qol.onUseMacroName`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Hide, postAttackRoll", priority: 20 },
            ],
            origin: args[0].uuid,
            flags: { "dae": { stackable: "noneName", specialDuration: ["1Attack","1Spell"] }, "core": { statusId: "Hidden" }, },
            disabled: false,
            label: "Hidden",
            icon: "icons/svg/cowled.svg"
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
    }
} else if (args[0].macroPass === "preAttackRoll" && tactor.data.flags["midi-qol"].hidden && ["mwak","rwak","msak","rsak"].includes(args[0].item.data.actionType) && args[0].targets.find(t => t?.actor && t.actor.data.data.skills.prc.passive < tactor.data.flags["midi-qol"].hidden)) {
    const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    attackWorkflow.advantage = true;
} else if (args[0].macroPass === "postAttackRoll" && tactor.data.flags["midi-qol"].hidden && !(tactor.data.flags["midi-qol"].skulker && args[0].hitTargets.length === 0 && !args[0].targets.find(t => t?.actor && t.actor.data.data.skills.prc.passive >= tactor.data.flags["midi-qol"].hidden))) {
    const effect = tactor.effects.find(e => e.data.label === "Hidden");
    if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
}
