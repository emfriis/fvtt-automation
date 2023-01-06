// preDamageRollComplete

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users.find(u => u.data.character === actor.id && u.active);
	if (!user) user = game.users.players.find(p => p.active && actor.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users.find(p => p.isGM && p.active);
	return user;
}

async function canSee(token, target) {
    let canSeeCV = game.modules.get('conditional-visibility')?.api?.canSee(token, target) ?? true;
    let canSeeLOS = !_levels?.advancedLosTestInLos(token, target);
    let canSeeLight = true;
    let inLight = _levels?.advancedLOSCheckInLight(target) ?? true;
    if (!inLight) {
        let vision = Math.min((token.data.flags["perfect-vision"].sightLimit ?? 9999), Math.max(token.data.dimSight, token.data.brightSight));
	    if (!vision || vision < MidiQOL.getDistance(token, target, false)) canSeeLight = false;
    }
    let canSee = canSeeCV && canSeeLOS && canSeeLight;
    return canSee;
}

Hooks.on("midi-qol.preDamageRollComplete", async (workflow) => {
    try {  

	    const targets = Array.from(workflow.hitTargets);
        for (let t = 0; t < targets.length; t++) {
        	const token = targets[t];
	  	    let tactor = token?.actor;
        	if (!tactor) continue;

            // spell effect damage resistance
            if (workflow.item.data.flags?.midiProperties?.spelleffect && tactor.data.data.traits.dr.includes("spell") && !["healing", "temphp"].includes(workflow.item.data.data?.damage?.parts[0][1])) {
                try {
                    console.warn("Spell Effect Damage Resistance activated");
                    const effectData = {
                        changes: [{ key: "data.traits.dr.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
                        disabled: false,
                        label: "Spell Effect Damage Resistance",
                        flags: { dae: { specialDuration: ["isAttacked", "isDamaged", "isHit"] } },
                    };
                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                    let hook = Hooks.on("midi-qol.preApplyDynamicEffects", async (workflowNext) => {
                        if (workflowNext.uuid === workflow.uuid) {
                            const effect = tactor.effects.find(i => i.data.label === "Spell Effect Damage Resistance");
                            if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                            Hooks.off("midi-qol.preApplyDynamicEffects", hook);
                        }
                    });
                    console.warn("Spell Effect Damage Resistance used");
                } catch (err) {
                    console.error("Spell Effect Damage Resistance error", err);
                }
            }

            // devil silver vulnerability
            if (workflow.item.data.type === "weapon" && workflow.item.data.data.properties.sil && tactor.data.data.details?.type?.subtype?.toLowerCase()?.includes("devil")) {
                try {
                    console.warn("Devil Silver Vulnerability activated");
                    if (tactor.data.data.traits.dr.value.includes("physical")) {
                        const effectData = {
                            changes: [{ key: "data.traits.dr.value", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "-physical", priority: 20, }],
                            disabled: false,
                            label: "Devil Silver Vulnerability",
                            flags: { dae: { specialDuration: ["isAttacked", "isDamaged", "isHit"] } },
                        };
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        let hook = Hooks.on("midi-qol.preApplyDynamicEffects", async (workflowNext) => {
                            if (workflowNext.uuid === workflow.uuid) {
                                const effect = tactor.effects.find(i => i.data.label === "Devil Silver Vulnerability");
                                if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                                Hooks.off("midi-qol.preApplyDynamicEffects", hook);
                            }
                        });
                        console.warn("Devil Silver Vulnerability used");
                    }
                } catch (err) {
                    console.error("Devil Silver Vulnerability error", err);
                }
            }
            // golem adamantine vulnerability
            if (workflow.item.data.type === "weapon" && workflow.item.data.data.properties.ada && tactor.name.toLowerCase().includes("golem")) {
                try {
                    console.warn("Golem Adamantine Vulnerability activated");
                    if (tactor.data.data.traits.dr.value.includes("physical")) {
                        const effectData = {
                            changes: [{ key: "data.traits.dr.value", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "-physical", priority: 20, }],
                            disabled: false,
                            label: "Golem Adamantine Vulnerability",
                            flags: { dae: { specialDuration: ["isAttacked", "isDamaged", "isHit"] } },
                        };
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        let hook = Hooks.on("midi-qol.preApplyDynamicEffects", async (workflowNext) => {
                            if (workflowNext.uuid === workflow.uuid) {
                                const effect = tactor.effects.find(i => i.data.label === "Golem Adamantine Vulnerability");
                                if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                                Hooks.off("midi-qol.preApplyDynamicEffects", hook);
                            }
                        });
                        console.warn("Golem Adamantine Vulnerability used");
                    }
                } catch (err) {
                    console.error("Golem Adamantine Vulnerability error", err);
                }
            }

            // shield
            if (workflow.item.name === "Magic Missile" && workflow.item.data.data.activation.type !== "action" && tactor.effects.find(e => e.data.label === "Shield")) {
                try {
                    console.warn("Shield activated");
                    const effectData = {
                        changes: [{ key: "data.traits.di.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
                        disabled: false,
                        label: "Shield Magic Missile Damage Immunity",
                        flags: { dae: { specialDuration: ["isAttacked", "isDamaged", "isHit"] } },
                    };
                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                    let hook = Hooks.on("midi-qol.preApplyDynamicEffects", async (workflowNext) => {
                        if (workflowNext.uuid === workflow.uuid) {
                            const effect = tactor.effects.find(i => i.data.label === "Shield Magic Missile Damage Immunity");
                            if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                            Hooks.off("midi-qol.preApplyDynamicEffects", hook);
                        }
                    });
                    console.warn("Shield used");
                } catch (err) {
                    console.error("Shield error", err);
                }
	  	    }

            // arcane ward
            /*if (workflow.item.data.data.damage.parts && !["healing","temphp"].includes(workflow.item.data.data.damage.parts[0][1])) {
                try {
                    console.warn("Arcane Ward activated");
                    let wardTokens = await canvas.tokens.placeables.filter(p => {
                        let wardToken = (
                            p?.actor && // exists
                            p.actor.data.flags["midi-qol"].arcaneWard && // has feature
                            p.actor.item.find(i => i.name === "Arcane Ward" && i.data.data.uses.value) && // feature charged
                            p.data.disposition === token.data.disposition && // is friendly
                            p.actor.uuid !== workflow.token.actor.uuid && // not attacker
                            MidiQOL.getDistance(p, token, false) <= 30 // in range
                        );
                        return wardToken;
                    });
                    for (let w = 0; w < wardTokens.length; w++) {
                        let ward = wardTokens[w];
                        let item = tactor.items.find(i => i.name === "Arcane Ward");
                        const effectData = {
                            changes: [{ key: `flags.midi-qol.DR.all`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `item.data.data.uses.value`, priority: 20, }],
                            disabled: false,
                            label: "Arcane Ward Damage Reduction",
                            flags: { dae: { specialDuration: ["isAttacked", "isDamaged", "isHit"] } },
                        };
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        let hook = Hooks.on("midi-qol.preApplyDynamicEffects", async (workflowNext) => {
                            if (workflowNext.uuid === workflow.uuid) {
                                const effect = tactor.effects.find(i => i.data.label === "Arcane Ward Damage Reduction");
                                if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                                Hooks.off("midi-qol.preApplyDynamicEffects", hook);
                            }
                        });
                    }
                } catch (err) {
                    console.error("Arcane Ward error", err);
                }
            }*/

            // fighting style interception
            if (["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType) && workflow.item.data.data.damage.parts) {
                try {
                    console.warn("Fighting Style Interception activated");
                    let protTokens = await canvas.tokens.placeables.filter(p => {
                        let protToken = (
                            p?.actor && // exists
                            p.actor.data.flags["midi-qol"].interception && // has feature
                            p.data.disposition === token.data.disposition && // is friendly
                            p.actor.uuid !== workflow.token.actor.uuid && // not attacker
                            p.actor.uuid !== token.actor.uuid && // not target
                            (p.actor.items.find(i => i.data.data?.armor?.type === "shield" && i.data.data.equipped) || p.actor.items.find(i => i.data.type === "weapon" && ["martialM","simpleM","martialR","simpleR"].includes(i.data.data.weaponType))) && // shield or weapon equipped
                            !p.actor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Reaction", "Stunned", "Unconscious"].includes(e.data.label)) && // can react
                            canSee(p, workflow.token) // can see attacker
                        );
                        return protToken;
                    });
                    for (let p = 0; p < protTokens.length; p++) {
                        let prot = protTokens[p];
                        if (MidiQOL.getDistance(prot, token, false) <= 5 && prot.data.disposition === token.data.disposition && prot.document.uuid !== token.document.uuid) {
                            let player = await playerForActor(prot.actor);
                            let useProtect = false;
                            useProtect = await USF.socket.executeAsUser("useDialog", player.id, { title: `Fighting Style: Interception`, content: `Use your reaction to reduce damage from attack against ${token.name}?` });
                            if (useProtect) {
                                const effectData = {
                                    changes: [{ key: `flags.midi-qol.DR.${workflow.item.data.data.actionType}`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `[[1d10 + ${prot.actor.data.data.attributes.prof}]]`, priority: 20, }],
                                    disabled: false,
                                    label: "Interception Damage Reduction",
                                    flags: { dae: { specialDuration: ["isAttacked", "isDamaged", "isHit"] } },
                                };
                                await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                                let hook = Hooks.on("midi-qol.preApplyDynamicEffects", async (workflowNext) => {
                                    if (workflowNext.uuid === workflow.uuid) {
                                        const effect = tactor.effects.find(i => i.data.label === "Interception Damage Reduction");
                                        if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                                        Hooks.off("midi-qol.preApplyDynamicEffects", hook);
                                    }
                                });
                                if (game.combat) game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: prot.actor.uuid });
                                console.warn("Fighting Style Interception used");
                            }
                        }
                    }
                } catch (err) {
                    console.error("Fighting Style Interception error", err);
                }
            }
	    }
    } catch(err) {
        console.error("preDamageRollComplete error", err);
    }
});