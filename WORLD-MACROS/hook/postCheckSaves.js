// postCheckSaves

function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

Hooks.on("midi-qol.postCheckSaves", async (workflow) => {
    try {

        let socket;
        if (game.modules.get("user-socket-functions").active) socket = socketlib.registerModule("user-socket-functions");
	    
        const targets = Array.from(workflow.targets);
        for (let t = 0; t < targets.length; t++) {
            let token = targets[t];
            let tactor = token.actor;
		    if (!tactor) continue;

            // shield master
            if (workflow.item.data.data.save.ability === "dex" && workflow.item.data.flags.midiProperties.halfdam && tactor.data.flags["midi-qol"].shieldMaster && tactor.items.find(i => i.data.data?.armor?.type === "shield" && i.data.data.equipped) && !tactor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Reaction", "Stunned", "Unconscious"].includes(e.data.label)) && !workflow.failedSaves.has(token)) {
                try {
                    console.warn("Shield Master activated");
                    let player = await playerForActor(token.actor);
                    let useShield = false;
                    if (player && socket) useShield = await socket.executeAsUser("useDialog", player.id, { title: `Shield Master`, content: `Use your reaction to reduce damage to zero?` });
                    if (useShield) {
                        const effectData = {
                            changes: [{ key: "data.traits.di.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
                            disabled: false,
                            label: `Shield Master Damage Reduction`,
                            flags: { dae: { specialDuration: "isDamaged" } },
                        };
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        let hook = Hooks.on("midi-qol.preApplyDynamicEffects", async (workflowNext) => {
                            if (workflowNext.uuid === workflow.uuid) {
                                const effect = tactor.effects.find(i => i.data.label === "Shield Master Damage Reduction");
                                if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                                Hooks.off("midi-qol.preApplyDynamicEffects", hook);
                            }
                        });
                        if (game.combat) game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: tactor.uuid });
                        console.warn("Shield Master used");
                    }
                } catch(err) {
                    console.error("Shield Master error", err);
                }
		    }
        }
    } catch(err) {
        console.error("postCheckSaves error", err);
    }
});