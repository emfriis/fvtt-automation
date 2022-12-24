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
	    const targets = Array.from(workflow.hitTargets);
        for (let t = 0; t < targets.length; t++) {
            let token = targets[t];
            let tactor = token.actor;
		    if (!tactor) continue;

            // spell resistance save
            if ((workflow.item.data.type === "spell" || workflow.item.data.flags?.midiProperties?.spelleffect) && workflow.item.data.data.save.ability && workflow.item.data.data.save.dc && tactor.data.flags["midi-qol"]?.spellResistance?.save) {
                try {
                    console.warn("Spell Resistance Save activated");
                    let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
                        if (actor === tactor && abilityId === workflow.item.data.data.save.ability) {
                            rollData.advantage = true;
                            Hooks.off("Actor5e.preRollAbilitySave", hook);
                        }
                    });
                    console.warn("Spell Resistance Save used");
                } catch (err) {
                    console.error("Spell Resistance Save error", err);
                }
            }

            // resilience
            if (workflow.item.data.data.save.ability && workflow.item.data.data.save.dc && tactor.data.flags["midi-qol"].resilience) {
                try {
                    const resilience = Object.keys(tactor.data.flags["midi-qol"].resilience);
                    console.warn("Resilience activated");
                    let resilientCondition, resilientDamage;
                    resilientCondition = workflow.item.data.effects.contents.find(e => resilience.includes(e.data.label.toLowerCase()) || e.data.changes.find(c => c.key === "StatusEffect" && resilience.find(r => c.value?.toLowerCase()?.includes(r))));
                    if (!resilientCondition) resilientDamage = workflow.item.data.data.damage.parts.find(p => resilience.includes(p[1]?.toLowerCase())) || resilience.find(r => workflow.item.data.data.formula?.toLowerCase()?.includes(r));
                    if (resilientCondition || resilientDamage) {
                        let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
                            if (actor === tactor && abilityId === workflow.item.data.data.save.ability) {
                                rollData.advantage = true;
                                Hooks.off("Actor5e.preRollAbilitySave", hook);
                            }
                        });
                        console.warn("Resilience used");
                    }

                } catch (err) {
                    console.error("Resilience error", err);
                }
            }

            // shield master
            if (workflow.item.data.data?.save?.ability === "dex" && targets.length === 1 && tactor.data.flags["midi-qol"].shieldMaster && tactor.items.find(i => i.data.data?.armor?.type === "shield" && i.data.data?.equipped) && !tactor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(e.data.label))) {
                try {
                    console.warn("Shield Master activated");
                    const effectData = {
                        changes: [{ key: "data.bonuses.abilities.save", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 2, priority: 20, }],
                        disabled: false,
                        label: `Shield Master`,
                        flags: { dae: { specialDuration: ["isSave"] } },
                    };
                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                    console.warn("Shield Master used");
                } catch(err) {
                    console.error("Shield Master error", err);
                }
		    }
        }
    } catch(err) {
        console.error("preCheckSaves error", err);
    }
});