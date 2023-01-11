// preItemRoll

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users.find(u => u.data.character === actor.id && u.active);
	if (!user) user = game.users.players.find(p => p.active && actor.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users.find(p => p.isGM && p.active);
	return user;
}

Hooks.on("midi-qol.preItemRoll", async (workflow) => {
    try {  
        
	    // incapacitated
        if (["action", "bonus", "reaction", "reactionDamaged", "reactionManual"].includes(workflow.item.data.data.activation.type) && workflow.actor.effects.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned", "Dead", "Defeated"].includes(e.data.label))) {
            try {
                console.warn("Incapacitated activated");
                ui.notifications.warn(`${workflow.actor.name} is Incapacitated`);
                console.warn("Incapacitated used");
                return false;
            } catch(err) {
                console.error("Incapacitated error", err);
            }
        }

        // combat action timing
        if (game.combat && ["minute", "hour", "day"].includes(workflow.item.data.data.activation.type)) {
            try {
                console.warn("Combat Action Timing activated");
                ui.notifications.warn(`${workflow.item.name} takes too long to use`);
                console.warn("Combat Action Timing used");
                return false;
            } catch(err) {
                console.error("Combat Action Timing error", err);
            }
        }

        // no reaction
        if (workflow.actor.data.flags["midi-qol"]?.noReaction && ["reaction", "reactiondamage", "reactionmanual"].includes(workflow.item.data.data.activation.type)) {
            try {
                console.warn("No Reaction Activated");
                ui.notifications.warn("Your reaction speed is dulled.");
                console.warn("No Reaction used");
                return false;
            } catch (err) {
                console.error("No Reaction error", err);
            }
        }

        // range check preamble
        let range;
        let longRange;
        if (workflow.token && [null, "", "creature", "ally", "enemy"].includes(workflow.item.data.data.target.type) && ["ft", "touch"].includes(workflow.item.data.data.range.units) && !(["mwak","msak"].includes(workflow.item.data.data.actionType) && game.combat && game.combat?.current.tokenId !== workflow.tokenId)) {
            try {
                console.warn("Range Check Preamble Activated");
                range = workflow.item.data.data.range.value ? workflow.item.data.data.range.value : 5;
                longRange = workflow.item.data.data.range.long ? workflow.item.data.data.range.long : 0;
                if (["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType) && workflow.actor.data.flags["midi-qol"].rangeBonus && workflow.actor.data.flags["midi-qol"].rangeBonus[workflow.item.data.data.actionType]) {
                    const bonus = workflow.actor.data.flags["midi-qol"].rangeBonus[workflow.item.data.data.actionType]?.split("+")?.reduce((accumulator, current) => Number(accumulator) + Number(current));
                    range += bonus;
                    if (longRange) longRange += bonus;
                }
                if (longRange && workflow.actor.data.flags["midi-qol"].sharpShooter && workflow.item.data.data.actionType === "rwak") range = longRange;
                if (workflow.actor.data.flags["midi-qol"].spellSniper && workflow.item.data.data.actionType === "rsak") range *= 2;
                // special cases
                if (workflow.item.type === "spell" && workflow.actor.items.find(i => i.name === "Metamagic: Distant Spell")) {
                    if (workflow.item.data.data.range.units === "ft") range *= 2;
                    if (workflow.item.data.data.range.units === "touch") range = 30;
                }
                if (workflow.actor.data.flags["midi-qol"].manifestMind) {
                    range = 9999;
                }
                console.warn("Range Check Preamble used", range);
            } catch (err) {
                console.error("Range Check Preamble error", err);
            }
        }

	    const targets = Array.from(workflow.targets);
        for (let t = 0; t < targets.length; t++) {
        	const token = targets[t];
	  	    let tactor = token?.actor;
        	if (!tactor) continue;

            // range check
            if (range && workflow.token && [null, "", "creature", "ally", "enemy"].includes(workflow.item.data.data.target.type) && ["ft", "touch"].includes(workflow.item.data.data.range.units)) {
                try {
                    console.warn("Range Check Activated");
                    const distance = MidiQOL.getDistance(workflow.token, token, false);
                    if (distance > range && distance > longRange) {
                        ui.notifications.warn("Target(s) not within range");
                        console.warn("Range Check used");
                        return false;
                    } else if (!workflow.disadvantage && distance > range && distance <= longRange && ["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) {
                        workflow.disadvantage = true;
                        console.warn("Range Check used");
                    }
                } catch (err) {
                    console.error("Range Check error", err);
                }
            }

            // sanctuary
            if (tactor.data.flags["midi-qol"].sanctuary) {
                try {
                    console.warn("Sanctuary activated");
                    const isAttack = ["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType);
                    const isHarmSpell = workflow.item.data.type === "spell" && ["action", "bonus", "reaction", "reactiondamage", "reactionmanual"].includes(workflow.item.data.data.activation.type) && ["creature","enemy","",null,undefined].includes(workflow.item.data.data.target.type) && workflow.token.data.disposition !== token.data.disposition;
                    if (isAttack || isHarmSpell) {
                        const spellDC = tactor.data.flags["midi-qol"].sanctuary;
                        const save = await USF.socket.executeAsGM("attemptSaveDC", { actorUuid: workflow.actor.uuid, saveName: `Sanctuary Save`, saveImg: `systems/dnd5e/icons/spells/haste-sky-3.jpg`, saveType: "save", saveDC: spellDC, saveAbility: "wis", magiceffect: true, spelleffect: true });
                        if (!save) {
                            let dialog = new Promise(async (resolve, reject) => {
                                new Dialog({
                                    title: "Sanctuary: Choose a new target",
                                    buttons: {
                                        Ok: {
                                            label: "Ok",
                                            callback: async () => {
                                                let targets = Array.from(game.user?.targets);
                                                if (targets.length !== 1 || targets[0].id === token.id) {
                                                    resolve(false);
                                                } else if (isAttack) {
                                                    workflow?.targets?.delete(token);
                                                    workflow?.targets?.add(targets[0]);
                                                } else if (isHarmSpell && !isAttack) {
                                                    workflow?.targets?.delete(token);
                                                    workflow?.hitTargets?.delete(token);
                                                    workflow?.saves?.delete(token);
                                                    workflow?.targets?.add(targets[0]);
                                                    workflow?.hitTargets?.add(targets[0]);
                                                    workflow?.saves?.add(targets[0]);
                                                }
                                                resolve(true);
                                            }
                                        }
                                    }
                                }).render(true);
                            });
                            let newTarget = await dialog;
                            console.warn("Sanctuary used");
                            if (!newTarget) return false;
                        }
                    }
                } catch (err) {
                    console.error("Sanctuary error", err);
                }
	  	    }
        }
    } catch(err) {
        console.error("preItemRoll error", err);
    }
});