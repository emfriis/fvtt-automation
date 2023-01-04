// preambleComplete

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

async function counterSequence(source, target) {
    if (game.modules.get("sequencer").active && hasProperty(Sequencer.Database.entries, "jb2a")) {
        new Sequence().effect().file("jb2a.impact.004.blue").atLocation(source).scaleToObject(1.5).sound().file("https://assets.forge-vtt.com/630fc11845b0e419bee903cd/combat-sound-fx/magic/effect/dispel-1.ogg").play();
        new Sequence().effect().file("jb2a.energy_strands.range.standard.blue").atLocation(source).stretchTo(target).play();
        new Sequence().wait(1250).effect().file("jb2a.impact.005.blue").atLocation(target).scaleToObject(3).play();
    }
}

Hooks.on("midi-qol.preambleComplete", async (workflow) => {
    try { 

        // range check cleanup
        if (workflow.token && [null, "", "creature", "ally", "enemy"].includes(workflow.item.data.data.target.type) && ["ft", "touch"].includes(workflow.item.data.data.range.units) && !(["mwak","msak"].includes(workflow.item.data.data.actionType) && game.combat && game.combat?.current.tokenId !== workflow.tokenId)) {
            try {
                console.warn("Range Check Cleanup Activated");
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

                const targets = Array.from(workflow.targets);
                for (let t = 0; t < targets.length; t++) {
                    const token = targets[t];
                    const distance = MidiQOL.getDistance(workflow.token, token, false);
                    if (distance > range && distance > longRange) {
                        ui.notifications.warn("Target(s) not within range");
                        console.warn("Range Check Cleanup used");
                        return false;
                    } else if (!workflow.disadvantage && distance > range && distance <= longRange && ["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) {
                        workflow.disadvantage = true;
                        console.warn("Range Check Cleanup used");
                    }
                }
            } catch (err) {
                console.error("Range Check Cleanup error", err);
            }
        }

        // silence
        if (workflow.item.data.type === "spell" && workflow.actor.data.flags["midi-qol"].silence && workflow.item.data.data?.components?.vocal && !workflow.actor.data.flags["midi-qol"].subtleSpell) {
            try {
              console.warn("Silence activated");
              ui.notifications.warn("You cannot perform verbal spell components - the spell fails");
              console.warn("Silence used");
              return false;
            } catch (err) {
              console.error("Silence error", err);
            }
        }

	    // counterspell
	    if (workflow.item.data.type === "spell" && ["action", "bonus", "reaction", "reactiondamage", "reactionmanual"].includes(workflow.item.data.data.activation.type)) {
            try {
		    console.warn("Counterspell activated");
            const components = workflow.item.data.data?.components;
            if ((components.vocal || components.somatic || components.material) && !(workflow.actor.data.flags["midi-qol"].subtleSpell && !components.material)) {
                let counterTokens = canvas.tokens.placeables.filter(c => {
                    let cToken = (
                        c?.actor && // exists
                        c.actor.items.find(i => i.name === "Counterspell" && i.type === "spell") && // has item
                        c.actor.uuid !== workflow.token.actor.uuid && // not caster
                        c.data.disposition !== workflow.token.data.disposition && // not friendly
                        !c.actor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Reaction", "Stunned", "Unconscious"].includes(e.data.label)) && // can react
                        MidiQOL.getDistance(c, workflow.token, false) <= 60 && // in range
                        canSee(c, workflow.token) // can see
                    );
                    return cToken;
                });
           		for (let c = 0; c < counterTokens.length; c++) {
                    let counter = counterTokens[c];
                    let player = await playerForActor(counter.actor);
			        let counterItem = counter.actor.items.find(i => 
                        i.name === "Counterspell" && 
                        i.type === "spell" &&
                        (       
                            ((i.data.data.preparation?.prepared || i.data.data.preparation.mode === "always" || i.data.data.preparation.mode === "pact") && Object.keys(counter.actor.data.data.spells).find(i => (counter.actor.data.data.spells.pact?.level >= 3 && counter.actor.data.data.spells.pact?.value > 0) || (i !== "pact" && parseInt(i.slice(-1)) >= 3 && counter.actor.data.data.spells[i]?.value > 0))) ||
                            ((i.data.data.preparation.mode === "atwill" || i.data.data.preparation.mode === "innate") && (i.data.data.uses?.value > 0 || !i.data.data.uses?.max))
                        )
			        );
                    let useCounter = false;
                    if (player && counterItem) useCounter = await USF.socket.executeAsUser("useDialog", player.id, { title: `Counterspell`, content: `Use your reaction to cast Counterspell?` });
                    if (useCounter) {
                    let options = { targetUuids: [workflow.tokenUuid] };
                    let counterCast = false;
                    if (options) counterCast = await USF.socket.executeAsUser("midiItemRoll", player.id, { itemUuid: counterItem.uuid, options: options});
                    if (counterCast && counterCast?.itemLevel && !counterCast?.countered) {
                        await counterSequence(counter, workflow.token);
                        if (workflow?.itemLevel <= 3 || counterCast?.itemLevel >= workflow?.itemLevel) {
                            if (workflow.item.name !== "Counterspell") {
                                if (workflow?.templateId) {
                                    try {
                                        await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [workflow?.templateId]);
                                    } catch {}
                                }
                                ChatMessage.create({ content: `The Spell is countered.` });
                                return false;
                            } else {
                                ChatMessage.create({ content: `The Spell is countered.` });
                                workflow.countered = true;  
                                break;
                            }
                        } else {
                            let rollOptions = { chatMessage: true, fastForward: true };
                            let roll = await MidiQOL.socket().executeAsUser("rollAbility", player.id, { request: "abil", targetUuid: counter.actor.uuid, ability: (counter.actor.data.data.attributes?.spellcasting), options: rollOptions });
                            if (game.dice3d) game.dice3d.showForRoll(roll);
                            if (roll.total >= workflow?.itemLevel + 10) {
                                if (workflow.item.name !== "Counterspell") {
                                    if (workflow?.templateId) {
                                        try {
                                            await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [workflow?.templateId]);
                                        } catch {}
                                    }
                                    ChatMessage.create({ content: `The Spell is countered.` });
                                    return false;
                                } else {
                                    ChatMessage.create({ content: `The Spell is countered.` });
                                    workflow.countered = true;  
                                    break;
                                }
                            } else {
                                ChatMessage.create({ content: `The Spell is failed to be countered.` });
                            }
                        }
                    }
				}
			  	console.warn("Counterspell used");
                    }
                }
            } catch(err) {
                console.error("Counterspell error", err);
            }
	    }

	    const targets = Array.from(workflow.targets);
        for (let t = 0; t < targets.length; t++) {
        	const token = targets[t];
	  	    let tactor = token?.actor;
        	if (!tactor) continue;

            // shield
            if (workflow.item.name === "Magic Missile" && workflow.item.data.data.activation.type === "action" && tactor.items.find(i => i.name === "Shield" && i.type === "spell") && !tactor.effects.find(e => e.data.label === "Shield")) {
                try {
                    console.warn("Shield activated");
                    const shieldItem = tactor.items.find(i => 
                        i.name === "Shield" && 
                        i.type === "spell" &&
                        (
                            ((i.data.data.preparation?.prepared || i.data.data.preparation.mode === "always" || i.data.data.preparation.mode === "pact") && Object.keys(tactor.data.data.spells).find(i => (tactor.data.data.spells.pact?.level >= 1 && tactor.data.data.spells.pact?.value > 0) || (i !== "pact" && parseInt(i.slice(-1)) >= 1 && tactor.data.data.spells[i]?.value > 0))) ||
                            ((i.data.data.preparation.mode === "atwill" || i.data.data.preparation.mode === "innate") && (i.data.data.uses?.value > 0 || !i.data.data.uses?.max))
                        )
                    );
                    const canReaction = !tactor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Reaction", "Stunned", "Unconscious"].includes(e.data.label));
                    if (shieldItem && canReaction) {
                        let player = await playerForActor(tactor);
                        let useShield = false;
                        useShield = await USF.socket.executeAsUser("useDialog", player.id, { title: `Magic Missile`, content: `Use your reaction to cast Shield?` });
                        if (useShield) {
                            if (shieldItem.uuid) await USF.socket.executeAsUser("midiItemRoll", player.id, { itemUuid: shieldItem.uuid, options: {  } });
                        }
                    }
                } catch (err) {
                    console.error("Shield error", err);
                }
            }
	    }	
    } catch(err) {
        console.error("preambleComplete error", err);
    }
});