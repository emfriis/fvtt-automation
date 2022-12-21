// preAttackRoll

function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users.find(u => u.data.character === actor.id && u.active);
	if (!user) user = game.users.players.find(p => p.active && actor.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users.find(p => p.isGM && p.active);
	return user;
}

function canSee(token, target) {
    let canSeeCV = game.modules.get('conditional-visibility')?.api?.canSee(token, target);
    let canSeeLOS = _levels?.advancedLosTestVisibility(token, target);
    let canSeeLight = true;
    let inLight = _levels?.advancedLOSCheckInLight(target);
    if (!inLight) {
        let vision = Math.min((token.data.flags["perfect-vision"].sightLimit ? token.data.flags["perfect-vision"].sightLimit : 9999), Math.max(token.data.dimSight, token.data.brightSight));
	  if (vision < MidiQOL.getDistance(token, target, false)) canSeeLight = false;
    }
    let canSee = canSeeCV && canSeeLOS && canSeeLight;
    return canSee;
}

Hooks.on("midi-qol.preAttackRoll", async (workflow) => {
    try {
        if (!["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) return;

        let socket;
        if (game.modules.get("user-socket-functions").active) socket = socketlib.registerModule("user-socket-functions");

	    // ranged proximity
        if (!workflow.disadvantage && ["rwak","rsak"].includes(workflow.item.data.data.actionType)) {
            try {
                console.warn("Ranged Proximity activated");
                const nearbyEnemy = canvas.tokens.placeables.find(p => 
                    p?.actor && // exists
                    !(p.actor.data.data.details?.type?.value?.length < 3) && // is a creature
                    p.document.uuid !== workflow.token.document.uuid && // not the attacker
                    p.document.uuid !== workflow.token.document.uuid && // not the target
                    !p.actor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Stunned", "Unconscious"].includes(e.data.label)) && // not incapacitated
                    p.data.disposition !== workflow.token.data.disposition && // not an ally
                    p.data.disposition !== 0 && // not neutral
                    MidiQOL.getDistance(p, workflow.token, false) <= 5 // within 5 feet
                );
                if (nearbyEnemy) {
                    workflow.disadvantage = true;
                    console.warn("Ranged Proximity used");
                }
            } catch (err) {
                console.error("Ranged Proximity error", err);
            }
        }

	    // frightened
        if (!workflow.disadvantage && workflow.actor.data.flags["midi-qol"].fear) {
            try {
                console.warn("Frightened activated");
                const seeFear = canvas.tokens.placeables.find(async p => 
                    p?.actor && // exists
                    workflow.actor.data.flags["midi-qol"].fear.includes(p.id) && // is fear source
                    await canSee(workflow.token, p) // can see los
                );
                if (seeFear) {
                    workflow.disadvantage = true;
                    console.warn("Frightened used");
                }
            } catch (err) {
                console.error("Frightened error", err);
            }
        }

        const targets = Array.from(workflow.targets);
        for (let t = 0; t < targets.length; t++) {
            let token = targets[t];
            let tactor = token.actor;
            if (!tactor) continue;

            // attacker unseen
            if (!workflow.advantage) {
                try {
                    console.warn("Attacker Unseen activated");
                    const targetSight = await canSee(token, workflow.token);
                    if (!targetSight) {
                        workflow.advantage = true;
                        console.warn("Attacker Unseen used");
                    }
                } catch (err) {
                    console.error("Attacker Unseen error", err);
                }
            }

            // target unseen
            if (!workflow.disadvantage) {
                try {
                    console.warn("Target Unseen activated");
                    const tokenSight = await canSee(workflow.token, token);
                    if (!tokenSight) {
                        workflow.disadvantage = true;
                        console.warn("Target Unseen used");
                    }
                } catch (err) {
                    console.error("Target Unseen error", err);
                }
            }

            // protection from evil and good
            if (!workflow.disadvantage && tactor.data.flags["midi-qol"].protectionFromEvilAndGood) {
                try {
                    console.warn("Protection from Evil and Good activated");
                    const types = ["aberration", "celestial", "elemental", "fey", "fiends", "undead"];
                    if (types.some(type => (workflow.actor.data.data.details?.type?.value || "").toLowerCase().includes(type) || (workflow.actor.data.data.details?.race || "").toLowerCase().includes(type))) {
                        workflow.disadvantage = true;
                        console.warn("Protection from Evil and Good used");	
                    }
                } catch(err) { 
                        console.error("Protection from Evil and Good error", err);
                    }	
            }

            // blur
            if (!workflow.disadvantage && tactor.data.flags["midi-qol"].blur) {
                try {
                    console.warn("Blur activated");
                    const senses = workflow.actor.data.data.attributes.senses;
                    if (!(Math.max(-1, senses.blindsight, senses.tremorsense, senses.truesight) >= MidiQOL.getDistance(workflow.token, token, false)) && await canSee(workflow.token, token)) {
                        workflow.disadvantage = true;
                        console.warn("Blur used");	
                    }
                } catch (err) {
                    console.error("Blur error", err);
                }
            }

            // fighting style protection
            if (!workflow.disadvantage) {
                try {
                    console.warn("Fighting Style Protection activated");
                    let protTokens = await canvas.tokens.placeables.filter(p => 
                            p?.actor && // exists
                            p.actor.uuid !== workflow.token.actor.uuid && // not attacker
                            p.actor.uuid !== token.actor.uuid && // not target
                            p.actor.data.flags["midi-qol"].protection && // has feature
                            p.actor.items.find(i => i.data.data?.armor?.type === "shield" && i.data.data.equipped) && // shield equipped
                            !p.actor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Reaction", "Stunned", "Unconscious"].includes(e.data.label)) && // can react
                            canSee(p, workflow.token) // can see attacker
                        );
                    for (let p = 0; p < protTokens.length; p++) {
                        let prot = protTokens[p];
                        if (MidiQOL.getDistance(prot, token, false) <= 5 && prot.data.disposition === token.data.disposition && prot.document.uuid !== token.document.uuid) {
                            let player = await playerForActor(prot.actor);
                            let useProtect = false;
                            if (socket) useProtect = await socket.executeAsUser("useDialog", player.id, { title: `Fighting Style: Protection`, content: `Use your reaction to impose disadvantage on attack against ${token.name}?` });
                            if (useProtect) {
                                workflow.disadvantage = true;
                                if (game.combat) game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: prot.actor.uuid });
                                console.warn("Fighting Style Protection used");
                            }
                        }
                    }
                } catch (err) {
                    console.error("Fighting Style Protection error", err);
                }
            }
        }
    } catch(err) {
        console.error("preAttackRoll Error", err);
    }
});