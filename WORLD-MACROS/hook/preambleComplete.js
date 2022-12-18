// preambleComplete

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

function counterSequence(source, target) {
    if (game.modules.get("sequencer").active && hasProperty(Sequencer.Database.entries, "jb2a")) {
        new Sequence().effect().file("jb2a.impact.004.blue").atLocation(source).scaleToObject(1.5).sound().file("https://assets.forge-vtt.com/630fc11845b0e419bee903cd/combat-sound-fx/magic/effect/dispel-1.ogg").play();
        new Sequence().effect().file("jb2a.energy_strands.range.standard.blue").atLocation(source).stretchTo(target).play();
        new Sequence().wait(1250).effect().file("jb2a.impact.005.blue").atLocation(target).scaleToObject(3).play();
    }
}

Hooks.on("midi-qol.preambleComplete", async (workflow) => {
    try { 

        let socket;
        if (game.modules.get("user-socket-functions").active) socket = socketlib.registerModule("user-socket-functions");

	    // counterspell
	    if (workflow.item.data.type === "spell" && ["action", "bonus", "reaction", "reactiondamage", "reactionmanual"].includes(workflow.item.data.data.activation.type)) {
            try {
		    console.warn("Counterspell activated");
            const components = workflow.item.data.data?.components;
            if (components.vocal || components.somatic || components.material) {
                let counterTokens = canvas.tokens.placeables.filter(p =>
                        p?.actor && // exists
                        p.actor.items.find(i => i.name === "Counterspell" && i.type === "spell") && // has item
                        p.actor.uuid !== workflow.token.actor.uuid && // not caster
                        p.data.disposition !== workflow.token.data.disposition && // not friendly
                        !p.actor.effects.find(e => ["Dead", "Defeated", "Incapacitated", "Paralyzed", "Petrified", "Reaction", "Stunned", "Unconscious"].includes(e.data.label)) && // can react
                        MidiQOL.getDistance(p, workflow.token, false) <= 60 && // in range
                        canSee(p, workflow.token) // can see
            	);
           		for (let c = 0; c < counterTokens.length; c++) {
                    let token = counterTokens[c];
                    let player = await playerForActor(token?.actor);
			        let counterItem = token.actor.items.find(i => 
                        i.name === "Counterspell" && 
                        i.type === "spell" &&
                        (       
                            ((i.data.data.preparation?.prepared || i.data.data.preparation.mode === "always" || i.data.data.preparation.mode === "pact") && Object.keys(p.actor.data.data.spells).find(i => (p.actor.data.data.spells.pact?.level >= 3 && p.actor.data.data.spells.pact?.value > 0) || (i !== "pact" && parseInt(i.slice(-1)) >= 3 && p.actor.data.data.spells[i]?.value > 0))) ||
                            ((i.data.data.preparation.mode === "atwill" || i.data.data.preparation.mode === "innate") && (i.data.data.uses?.value > 0 || !i.data.data.uses?.max))
                        )
			        );
                    let useCounter = false;
                    if (socket && player && counterItem) useCounter = await socket.executeAsUser("useDialog", player.id, { title: `Counterspell`, content: `Use your reaction to cast Counterspell?` });
                    if (useCounter) {
                    let options = { targetUuids: [workflow.tokenUuid] };
                    let counterCast = false;
                    if (options) counterCast = await socket.executeAsUser("midiItemRoll", player.id, { itemUuid: counterItem.uuid, options: options});
                    if (counterCast && counterCast?.itemLevel && !counterCast?.countered) {
                        counterSequence(token, workflow.token);
                        let level = counterCast.itemLevel;
                        if (level >= workflow?.itemLevel) {
                            if (workflow.item.name !== "Counterspell") {
                                if (workflow?.templateId) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [workflow.templateId]);
                                return false;
                            } else {
                                workflow.countered = true;
                            }
                        } else {
                            let rollOptions = { chatMessage: true, fastForward: true };
                            let roll = await MidiQOL.socket().executeAsUser("rollAbility", player.id, { request: "abil", targetUuid: token.actor?.uuid, ability: (token.actor.data.data.attributes?.spellcasting), options: rollOptions });
                            if (game.dice3d) game.dice3d.showForRoll(roll);
                            if (roll.total >= workflow?.itemLevel + 10) {
                                if (workflow.item.name !== "Counterspell") {
                                    if (workflow?.templateId) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [workflow.templateId]);
                                    return false;
                                } else {
                                    workflow.countered = true;  
                                }
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
                        let socket = socketlib.registerModule("user-socket-functions");
                        let useShield = false;
                        if (socket && player) useShield = await socket.executeAsUser("useDialog", player.id, { title: `Magic Missile`, content: `Use your reaction to cast Shield?` });
                        if (useShield) {
                            if (shieldItem.uuid) await socket.executeAsUser("midiItemRoll", player.id, { itemUuid: shieldItem.uuid, options: {  } });
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