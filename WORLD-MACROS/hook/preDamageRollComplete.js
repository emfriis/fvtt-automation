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

            // calculate damage
            let totalDamage = 0;
            if (workflow.item.data.data.damage.parts) {
                try {
                    console.warn("Calculate Damage activated");
                    for (let d = 0; d < workflow.damageDetail?.length ?? 0; d++) {
                        let damage = workflow.damageDetail[d].damage;
                        let type = workflow.damageDetail[d].type;
                        let isPhysical = ["bludgeoning","piercing","slashing"].includes(type);
                        let isAdamantine = workflow.item.data.data?.properties?.ada;
                        let isSilver = workflow.item.data.data?.properties?.sil;
                        let isMagic = workflow.item.type === "spell" || workflow.item.data.flags?.midiProperties?.spelleffect || workflow.item.data.flags?.midiProperties?.magiceffect || workflow.item.data.flags?.midiProperties?.magicdam;
                        let isSpell = workflow.item.type === "spell" || workflow.item.data.flags?.midiProperties?.spelleffect;
                        let drApplied;
                        let dvApplied;
                        // apply generic immunity
                        if (tactor.data.data.traits.di.value.includes(type)) continue;
                        // apply physical immunity
                        if (isPhysical) {
                            if (tactor.data.data.traits.di.value.includes("physical") && !isMagic) { 
                                continue;
                            } else if (tactor.data.data.traits.di.value.includes("adamant") && !isAdamantine && !isMagic) {
                                continue;
                            } else if (tactor.data.data.traits.di.value.includes("silver") && !isSilver && !isMagic) { 
                                continue;
                            }
                        }
                        // apply magic immunity
                        if (isMagic) {
                            if (tactor.data.data.traits.di.value.includes("magic")) {
                                continue;
                            } else if (tactor.data.data.traits.di.value.includes("spell") && isSpell) {
                                continue;
                            }
                        } else if (tactor.data.data.traits.di.value.includes("nonmagic")) {
                            continue;
                        }
                        // apply generic resistance
                        if (tactor.data.data.traits.dr.value.includes(type)) {
                            damage = Math.floor(damage / 2);
                            drApplied = true;
                        }
                        // apply physical resistance
                        if (!drApplied && isPhysical) {
                            if (tactor.data.data.traits.dr.value.includes("physical") && !isMagic) { 
                                damage = Math.floor(damage / 2);
                                drApplied = true;
                            } else if (tactor.data.data.traits.dr.value.includes("adamant") && !isAdamantine && !isMagic) {
                                damage = Math.floor(damage / 2);
                                drApplied = true;
                            } else if (tactor.data.data.traits.dr.value.includes("silver") && !isSilver && !isMagic) { 
                                damage = Math.floor(damage / 2);
                                drApplied = true;
                            }
                        }
                        // apply magic resitance
                        if (!drApplied && isMagic) {
                            if (tactor.data.data.traits.dr.value.includes("magic")) {
                                damage = Math.floor(damage / 2);
                                drApplied = true;
                            } else if (tactor.data.data.traits.dr.value.includes("spell") && isSpell) {
                                damage = Math.floor(damage / 2);
                                drApplied = true;
                            }
                        } else if (tactor.data.data.traits.dr.value.includes("nonmagic")) {
                            damage = Math.floor(damage / 2);
                            drApplied = true;
                        }
                        // apply generic vulnerability
                        if (tactor.data.data.traits.dv.value.includes(type)) {
                            damage *= 2;
                            dvApplied = true;
                        }
                        // apply physical vulnerability
                        if (!drApplied && isPhysical) {
                            if (tactor.data.data.traits.dv.value.includes("physical") && !isMagic) { 
                                damage *= 2;
                                drApplied = true;
                            } else if (tactor.data.data.traits.dv.value.includes("adamant") && !isAdamantine && !isMagic) {
                                damage *= 2;
                                drApplied = true;
                            } else if (tactor.data.data.traits.dv.value.includes("adamant") && !isSilver && !isMagic) { 
                                damage *= 2;
                                drApplied = true;
                            }
                        }
                        // apply magic vulnerability
                        if (!drApplied && isMagic) {
                            if (tactor.data.data.traits.dv.value.includes("magic")) {
                                damage *= 2;
                                drApplied = true;
                            } else if (tactor.data.data.traits.dv.value.includes("spell") && isSpell) {
                                damage *= 2;
                                drApplied = true;
                            }
                        } else if (tactor.data.data.traits.dv.value.includes("nonmagic")) {
                            damage *= 2;
                            dvApplied = true;
                        }
                        // apply damage reduction
                        let drAll = getProperty(tactor.data, `flags.midi-qol.DR.all`) || 0;
                        let drAction = getProperty(tactor.data, `flags.midi-qol.DR.${workflow.item.data.data.actionType}`) || 0;
                        let drType = getProperty(tactor.data, `flags.midi-qol.DR.${type}`) || 0;
                        let drPhysical = isPhysical && !isMagic ? getProperty(tactor.data, `flags.midi-qol.DR.physical`) || 0 : 0;
                        let drNonPhysical = !isPhysical ? getProperty(tactor.data, `flags.midi-qol.DR.non-physical`) || 0 : 0;
                        let drAdamantine = isPhysical && !isAdamantine && !isMagic ? getProperty(tactor.data, `flags.midi-qol.DR.non-adamant`) || 0 : 0;
                        let drSilver = isPhysical && !isSilver && !isMagic ? getProperty(tactor.data, `flags.midi-qol.DR.non-silver`) || 0 : 0;
                        let drMagic = isMagic ? getProperty(tactor.data, `flags.midi-qol.DR.magic`) || 0 : 0;
                        let drNonMagic = !isMagic ? getProperty(tactor.data, `flags.midi-qol.DR.non-magic`) || 0 : 0;
                        let drTotal = drAll + drAction + drType + drPhysical + drNonPhysical + drAdamantine + drSilver + drMagic + drNonMagic;
                        damage -= drTotal;
                        // append to total damage
                        totalDamage += damage;
                    }
                    console.warn("Calculate Damage used", totalDamage);
                } catch (err) {
                    console.error("Calculate error", err);
                }
            }

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

            // arcane ward
            if (workflow.item.data.data.damage.parts && !["healing","temphp"].includes(workflow.item.data.data.damage.parts[0][1]) && !(workflow.item.data.data.actionType === "save" && (workflow.superSavers.has(token) || (worklow.item.data.flags.midiProperties.nodam && !workflow.failedSaves.has(token))))) {
                try {
                    console.warn("Arcane Ward activated");
                    let wardTokens = await canvas.tokens.placeables.filter(p => {
                        let wardToken = (
                            p?.actor && // exists
                            p.actor.data.flags["midi-qol"].arcaneWard && // has feature
                            p.actor.items.find(i => i.name === "Arcane Ward" && i.data.data.uses.value) && // feature charged
                            p.data.disposition === token.data.disposition && // is friendly
                            p.actor.uuid !== workflow.token.actor.uuid && // not attacker
                            (p.id === token.id || MidiQOL.getDistance(p, token, false) <= 30) // in range
                        );
                        return wardToken;
                    });
                    for (let w = 0; w < wardTokens.length; w++) {
                        if (tactor.effects.find(e => e.data.label === "Arcane Ward Damage Reduction")) continue;
                        let ward = wardTokens[w];
                        let featItem = ward.actor.items.find(i => i.name === "Arcane Ward");
                        if (totalDamage && ward.actor.uuid === tactor.uuid) {
                            const effectData = {
                                changes: [{ key: `flags.midi-qol.DR.all`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `${Math.min(totalDamage, featItem.data.data.uses.value)}`, priority: 20, }],
                                disabled: false,
                                label: "Arcane Ward Damage Reduction",
                                origin: featItem.uuid,
                                flags: { dae: { specialDuration: ["isAttacked", "isDamaged", "isHit"] } },
                            };
                            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                            if (featItem) await USF.socket.executeAsGM("updateItem", { itemUuid: featItem.uuid, updates: {"data.uses.value" : Math.max(0, featItem.data.data.uses.value - totalDamage) } });
                            let hook = Hooks.on("midi-qol.preApplyDynamicEffects", async (workflowNext) => {
                                if (workflowNext.uuid === workflow.uuid) {
                                    const effect = tactor.effects.find(i => i.data.label === "Arcane Ward Damage Reduction");
                                    if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                                    Hooks.off("midi-qol.preApplyDynamicEffects", hook);
                                }
                            });
                        } else if (totalDamage && !ward.actor.effects.find(e => e.data.label === "Reaction")) {
                            let player = await playerForActor(ward.actor);
                            let useWard = false;
                            useWard = await USF.socket.executeAsUser("useDialog", player.id, { title: `Arcane Ward`, content: `Use your reaction to reduce damage against ${token.name}?` });
                            if (useWard) {
                                const effectData = {
                                    changes: [{ key: `flags.midi-qol.DR.all`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `${Math.min(totalDamage, featItem.data.data.uses.value)}`, priority: 20, }],
                                    disabled: false,
                                    label: "Arcane Ward Damage Reduction",
                                    origin: featItem.uuid,
                                    flags: { dae: { specialDuration: ["isAttacked", "isDamaged", "isHit"] } },
                                };
                                await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                                if (featItem) await USF.socket.executeAsGM("updateItem", { itemUuid: featItem.uuid, updates: {"data.uses.value" : Math.max(0, featItem.data.data.uses.value - totalDamage) } });
                                let hook = Hooks.on("midi-qol.preApplyDynamicEffects", async (workflowNext) => {
                                    if (workflowNext.uuid === workflow.uuid) {
                                        const effect = tactor.effects.find(i => i.data.label === "Arcane Ward Damage Reduction");
                                        if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
                                        Hooks.off("midi-qol.preApplyDynamicEffects", hook);
                                    }
                                });
                                if (game.combat) game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: ward.actor.uuid });
                            }
                        }
                    }
                } catch (err) {
                    console.error("Arcane Ward error", err);
                }
            }
	    }
    } catch(err) {
        console.error("preDamageRollComplete error", err);
    }
});