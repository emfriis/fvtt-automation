// preAttackRoll

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

Hooks.on("midi-qol.preAttackRoll", async (workflow) => {
    try {
        if (!["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) return;

	    // ranged proximity
        if (!workflow.disadvantage && ["rwak","rsak"].includes(workflow.item.data.data.actionType) && !workflow.actor.data.flags["midi-qol"].ignoreNearbyFoes) {
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
        if (!workflow.disadvantage && workflow.actor.data.flags["midi-qol"].fear && !workflow.actor.data.data.traits.ci.value.includes("frightened")) {
            try {
                console.warn("Frightened activated");
                let fearIds = workflow.actor.data.flags["midi-qol"].fear.split("+");
                for (let f = 0; f < fearIds.length; f++) {
                    let fearToken = canvas.tokens.get(fearIds[f]);
                    if (fearToken && await canSee(workflow.token, fearToken)) {
                        workflow.disadvantage = true;
                        console.warn("Frightened used");
                        break;
                    }
                }
            } catch (err) {
                console.error("Frightened error", err);
            }
        }

        // underwater
        if (!workflow.disadvantage && workflow.actor.data.flags["midi-qol"].underwater && ["mwak","rwak"].includes(workflow.item.data.data.actionType)) {
            try {
                console.warn("Underwater activated");
                let mwakIgnore = ["dagger", "spear", "javelin", "trident", "shorsword"];
                let rwakIgnore = ["crossbow", "dart", "net"];
                if (!workflow.actor.data.data.attributes.movement.swim && workflow.item.data.data.actionType === "mwak" && !mwakIgnore.some(i => workflow.item.data.data.baseItem === i || workflow.item.name.toLowerCase().includes(i))) {
                    workflow.disadvantage = true;
                    console.warn("Underwater used");
                }
                if (workflow.item.data.data.actionType === "rwak" && !rwakIgnore.some(i => workflow.item.data.data.baseItem === i || workflow.item.name.toLowerCase().includes(i))) {
                    workflow.disadvantage = true;
                    console.warn("Underwater used");
                }
            } catch (err) {
                console.error("Underwater error", err);
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

            // umbral sight
            if (tactor.data.flags["midi-qol"].umbralSight || workflow.actor.data.flags["midi-qol"].umbralSight) {
                try {
                    console.warn("Umbral Sight activated");
                    if (!workflow.disadvantage && tactor.data.flags["midi-qol"].umbralSight && workflow.actor.data.data.attributes.senses.darkvision && !(_levels?.advancedLOSCheckInLight(token) ?? true)) {
                        if (workflow.token.data.brightSight < MidiQOL.getDistance(workflow.token, token, false)) {
                            workflow.disadvantage = true;
                            console.warn("Umbral Sight used");
                        }
                    }
                    if (!workflow.advantage && workflow.actor.data.flags["midi-qol"].umbralSight && tactor.data.data.attributes.senses.darkvision && !(_levels?.advancedLOSCheckInLight(workflow.token) ?? true)) {
                        if (token.data.brightSight < MidiQOL.getDistance(token, workflow.token, false)) {
                            workflow.advantage = true;
                            console.warn("Umbral Sight used");
                        }
                    }
                } catch (err) {
                    console.error("Umbral Sight error", err);
                }
            }

            // underwater range check
            if (workflow.actor.data.flags["midi-qol"].underwater && ["mwak","rwak"].includes(workflow.item.data.data.actionType)) {
                try {
                    console.warn("Underwater Range Check activated");
                    let range = workflow.item.data.data.range.value ? workflow.item.data.data.range.value : 5;
                    let longRange = workflow.item.data.data.range.long ? workflow.item.data.data.range.long : 0;
                    if (["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType) && workflow.actor.data.flags["midi-qol"].rangeBonus && workflow.actor.data.flags["midi-qol"].rangeBonus[workflow.item.data.data.actionType]) {
                        const bonus = workflow.actor.data.flags["midi-qol"].rangeBonus[workflow.item.data.data.actionType]?.split("+")?.reduce((accumulator, current) => Number(accumulator) + Number(current));
                        range += bonus;
                        if (longRange) longRange += bonus;
                    }
                    if (longRange && workflow.actor.data.flags["midi-qol"].sharpShooter && workflow.item.data.data.actionType === "rwak") range = longRange;
                    if (workflow.actor.data.flags["midi-qol"].spellSniper && workflow.item.data.data.actionType === "rsak") range *= 2;
                    if (workflow.actor.data.flags["midi-qol"].distantSpell && workflow.item.type === "spell") {
                        if (workflow.item.data.data.range.units === "ft") range *= 2;
                        if (workflow.item.data.data.range.units === "touch") range = 30;
                    }
                    const distance = MidiQOL.getDistance(workflow.token, token, false);
                    if (range < distance) {
                        console.warn("Underwater Range Check used");
                        return false;
                    }
                } catch (err) {
                    console.error("Underwater Range Check error", err);
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

            // taunt 
            if (!workflow.disadvantage && workflow.actor.data.flags["midi-qol"].taunt) {
                try {
                    console.warn("Taunt activated");
                    if (!workflow.actor.data.flags["midi-qol"].taunt.includes(token.id)) {
                        workflow.disadvantage = true;
                        console.warn("Taunt used");	
                    }
                } catch (err) {
                    console.error("Taunt error", err);
                }
            }

            // fighting style protection
            try {
                console.warn("Fighting Style Protection activated");
                let protTokens = await canvas.tokens.placeables.filter(p => {
                    let pToken = (
                        p?.actor && // exists
                        p.actor.data.flags["midi-qol"].protection && // has feature
                        p.data.disposition === token.data.disposition && // is friendly
                        p.actor.uuid !== workflow.token.actor.uuid && // not attacker
                        p.actor.uuid !== token.actor.uuid && // not target
                        p.actor.items.find(i => i.isArmor && i.data.data?.armor?.type === "shield" && i.data.data.equipped) && // shield equipped
                        !p.actor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Reaction", "Stunned", "Unconscious"].includes(e.data.label)) && // can react
                        canSee(p, workflow.token) && // can see attacker
                        MidiQOL.getDistance(p, token, false) <= 5 // in range
                    );
                    return pToken;
                });
                for (let p = 0; p < protTokens.length; p++) {
                    let prot = protTokens[p];
                    let player = await playerForActor(prot.actor);
                    let useProtect = false;
                    useProtect = await USF.socket.executeAsUser("useDialog", player.id, { title: `Fighting Style: Protection`, content: `Use your reaction to impose disadvantage on attack against ${token.name}?` });
                    if (useProtect) {
                        workflow.disadvantage = true;
                        if (game.combat) game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: prot.actor.uuid });
                        console.warn("Fighting Style Protection used");
                    }
                }
            } catch (err) {
                console.error("Fighting Style Protection error", err);
            }
        }
    } catch(err) {
        console.error("preAttackRoll Error", err);
    }
});