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
            if (!workflow.advantage && !tactor.data.flags["midi-qol"].ignoreAttackerUnseen) {
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
            if (!workflow.disadvantage && !workflow.actor.data.flags["midi-qol"].ignoreTargetUnseen) {
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
                    // attacker unseen
                    if (!workflow.advantage && !tactor.data.flags["midi-qol"].ignoreAttackerUnseen && workflow.actor.data.flags["midi-qol"].umbralSight && tactor.data.data.attributes.senses.darkvision && !(_levels?.advancedLOSCheckInLight(workflow.token) ?? true)) {
                        if (token.data.brightSight < MidiQOL.getDistance(token, workflow.token, false)) {
                            workflow.advantage = true;
                            console.warn("Umbral Sight used");
                        }
                    }
                    // target unseen
                    if (!workflow.disadvantage && !workflow.actor.data.flags["midi-qol"].ignoreTargetUnseen && tactor.data.flags["midi-qol"].umbralSight && workflow.actor.data.data.attributes.senses.darkvision && !(_levels?.advancedLOSCheckInLight(token) ?? true)) {
                        if (workflow.token.data.brightSight < MidiQOL.getDistance(workflow.token, token, false)) {
                            workflow.disadvantage = true;
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

            // advantage against
            if (!workflow.advantage && workflow.actor.data.flags["midi-qol"].advantageAgainst) {
                try {
                    console.warn("Advantage Against activated");
                    if ((workflow.actor.data.flags["midi-qol"].advantageAgainst[workflow.item.data.data.actionType] || workflow.actor.data.flags["midi-qol"].advantageAgainst.all) && (workflow.actor.data.flags["midi-qol"].advantageAgainst[workflow.item.data.data.actionType]?.includes(token.id) || workflow.actor.data.flags["midi-qol"].advantageAgainst.all?.includes(token.id))) {
                        workflow.advantage = true;
                        console.warn("Advantage Against used");	
                    }
                } catch (err) {
                    console.error("Advantage Against error", err);
                }
            }

            // disadvantage against
            if (!workflow.disadvantage && workflow.actor.data.flags["midi-qol"].disadvantageAgainst) {
                try {
                    console.warn("Disadvantage Against activated");
                    if ((workflow.actor.data.flags["midi-qol"].disadvantageAgainst[workflow.item.data.data.actionType] || workflow.actor.data.flags["midi-qol"].disadvantageAgainst.all) && (workflow.actor.data.flags["midi-qol"].disadvantageAgainst[workflow.item.data.data.actionType]?.includes(token.id) || workflow.actor.data.flags["midi-qol"].disadvantageAgainst.all?.includes(token.id))) {
                        workflow.disadvantage = true;
                        console.warn("Disadvantage Against used");	
                    }
                } catch (err) {
                    console.error("Disadvantage Against error", err);
                }
            }

            // lucky
            if (tactor.data.flags["midi-qol"].lucky && tactor.items.find(i => i.name === "Lucky" && i.data.data.uses.value)) {
                try {
                    console.warn("Lucky activated");
                    let luckyItem = tactor.items.find(i => i.name === "Lucky" && i.data.data.uses.value);
                    let player = await playerForActor(tactor);
                    let useLucky = false;
                    useLucky = await USF.socket.executeAsUser("useDialog", player.id, { title: `Lucky`, content: `Use a luck point to impose disadvantage on attack against you?` });
                    if (useLucky && luckyItem) {
                        workflow.disadvantage = true;
                        await USF.socket.executeAsGM("updateItem", { itemUuid: luckyItem.uuid, updates: {"data.uses.value" : luckyItem.data.data.uses.value - 1} });
                        console.warn("Lucky activated");
                    }
                } catch (err) {
                    console.error("Lucky error", err);
                }
            }

            // shadowy dodge
            if (!workflow.advantage && tactor.data.flags["midi-qol"].shadowyDodge && !tactor.effects.find(e => e.data.label === "Reaction")) {
                try {
                    console.warn("Shadowy Dodge activated");
                    let player = await playerForActor(tactor);
                    let useFeat = false;
                    useFeat = await USF.socket.executeAsUser("useDialog", player.id, { title: `Shadowy Dodge`, content: `Use your reaction to impose disadvantage on attack against you?` });
                    if (useFeat) {
                        workflow.disadvantage = true;
                        if (game.combat) game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: tactor.uuid });
                        console.warn("Shadowy Dodge activated");
                    }
                } catch (err) {
                    console.error("Shadowy Dodge error", err);
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

            // cutting words attack roll
            try {
                console.warn("Cutting Words Attack Roll activated");
                let wordTokens = await canvas.tokens.placeables.filter(p => {
                    let wordToken = (
                        p?.actor && // exists
                        p.actor.data.flags["midi-qol"].cuttingWords && // has feature
                        p.actor.items.find(i => i.name === "Bardic Inspiration" && i.data.data.uses.value) && // feature charged
                        !p.actor.effects.find(e => e.data.label === "Reaction") && // has reaction
                        p.data.disposition === token.data.disposition && // is friendly
                        MidiQOL.getDistance(p, workflow.token, false) <= 60 && // in range
                        canSee(p, workflow.token) // can see
                    );
                    return wordToken;
                });
                for (let w = 0; w < wordTokens.length; w++) {
                    let word = wordTokens[w];
                    let featItem = word.actor.items.find(i => i.name === "Bardic Inspiration");
                    let uses = featItem.data.data.uses.value;
                    let player = await playerForActor(word.actor);
                    let useWord = false;
                    useWord = await USF.socket.executeAsUser("useDialog", player.id, { title: `Cutting Words`, content: `Use your reaction and a bardic inspiration die to reduce the attack roll against ${token.name}?` });
                    if (useWord) {
                        let actorData = await word.actor.getRollData();
                        let bardLevel = actorData.classes?.bard?.levels;
                        let bardicDie = bardLevel >= 15 ? "1d12" : bardLevel >= 10 ? "1d10" : bardLevel >= 5 ? "1d8" : bardLevel >= 1 ? "1d6" : null;
                        if (!bardicDie) continue;
                        let roll = await USF.socket.executeAsUser("rollSimple", player.id, { rollable: bardicDie });
                        const effectData = [{
                            changes: [{ key: `data.bonuses.All-Attacks`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `-${roll.total}`, priority: 20, }],
                            disabled: false,
                            label: "Cutting Words Attack Roll Reduction",
                            origin: featItem.uuid,
                            flags: { dae: { specialDuration: ["1Hit","1Attack","1Spell","DamageDealt"] } },
                        }];
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: workflow.actor.uuid, effects: effectData });
                        if (featItem) await USF.socket.executeAsGM("updateItem", { itemUuid: featItem.uuid, updates: {"data.uses.value" : Math.max(0, uses - 1) } });
                        if (game.combat) game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: word.actor.uuid });
                        console.warn("Cutting Words Attack Roll used");
                    }
                }
            } catch (err) {
                console.error("Cutting Words Attack Roll error", err);
            }
        }
    } catch(err) {
        console.error("preAttackRoll Error", err);
    }
});