// preCheckSaves

function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

Hooks.on("midi-qol.preCheckSaves", async (workflow) => {
    try {
	    const targets = Array.from(workflow.targets);
        for (let t = 0; t < targets.length; t++) {
            let token = targets[t];
            let tactor = token.actor;
		    if (!tactor) continue;

            // spell resistance
            if (workflow.item.data.type === "spell" && workflow.item.data.data.actionType === "save" && (tactor.effects.find(e => ["Magic Resistance", "Magic Resilience", "Spell Resilience", "Spell Resistance"].includes(e.data.label)) || tactor.items.find(i => ["Magic Resistance", "Magic Resilience", "Spell Resilience", "Spell Resistance"].includes(i.name)))) {
                try {
                    const effectData = {
                        changes: [ { key: "flags.midi-qol.advantage.ability.save.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, } ],
                        disabled: false,
                        flags: { dae: { specialDuration: "isSave" } },
                        label: "Spell Save Advantage"
                    }
                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                } catch (err) {
                    console.error("Spell Resistance error", err)
                }
            }

            // shield master
            if (workflow.item.data.data.save.ability === "dex" && targets.size === 1 && tactor.items.find(i => i.data.name === "Shield Master") && tactor.items.find(i => i.data.data?.armor.type === "shield" && i.data.data?.equipped) && !tactor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Reaction", "Stunned", "Unconscious"].inludes(e.data.label))) {
                try {
                    console.warn("Shield Master activated");
                    const effectData = {
                        changes: [{ key: "data.bonuses.abilities.save", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 2, priority: 20, }],
                        disabled: false,
                        label: `Shield Master`,
                        flags: { dae: { specialDuration: "isSave" } },
                    };
                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                    console.warn("Shield Master used");
                } catch(err) {
                    console.error("Shield Master error", err);
                }
		    }
        }
    } catch(err) {
        console.error("posCheckSaves error", err);
    }
});