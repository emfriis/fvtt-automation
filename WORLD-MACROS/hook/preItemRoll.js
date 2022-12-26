// preItemRoll

function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users.find(u => u.data.character === actor.id && u.active);
	if (!user) user = game.users.players.find(p => p.active && actor.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users.find(p => p.isGM && p.active);
	return user;
}

async function canSee(token, target) {
	let canSeeCV = game.modules.get('conditional-visibility')?.api?.canSee(token, target);
    let canSeeLos = _levels?.advancedLosTestVisibility(token, target);
    let canSeeLight = true;
    let inLight = _levels?.advancedLOSCheckInLight(target);
    if (!inLight) {
        let vision = Math.min((token.data.flags["perfect-vision"].sightLimit ? token.data.flags["perfect-vision"].sightLimit : 9999), Math.max(token.data.dimSight, token.data.brightSight));
        if (vision < MidiQOL.getDistance(token, target, false)) canSeeLight = false;
    }
    let canSee = canSeeCV && canSeeLos && canSeeLight;
    return canSee;
}

Hooks.on("midi-qol.preItemRoll", async (workflow) => {
    try {  
        
	    // incapacitated
        if (["action", "bonus", "reaction", "reactionDamaged", "reactionManual"].includes(workflow.item.data.data.activation.type)) {
            try {
                console.warn("Incapacitated activated");
                if (workflow.actor.effects.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.data.label))) {
                    ui.notifications.warn(`${workflow.actor.name} is Incapacitated`);
                    console.warn("Incapacitated used");
                    return false;
                }
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
                if (workflow.item.type === "spell" && workflow.actor.items.find(i => i.name === "Metamagic: Distant Spell")) {
                    if (workflow.item.data.data.range.units === "ft") range *= 2;
                    if (workflow.item.data.data.range.units === "touch") range = 30;
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
                    const isHarmSpell = workflow.item.data.type === "spell" && ["action", "bonus", "reaction", "reactiondamage", "reactionmanual"].includes(workflow.item.data.data.activation.type) && ["creature", "enemy"].includes(workflow.item.data.data.target.type) && workflow.token.data.disposition !== token.data.disposition;
                    if (isAttack || isHarmSpell) {
                        const effect = tactor.effects.find(e => e.data.label === "Sanctuary");
                        const item = await fromUuid(effect.data.origin);
                        const parent = item?.parent;
                        const dc = parent.data.data.attributes.spelldc;
                        const itemData = {
                            name: `Sanctuary Save`,
                            img: `systems/dnd5e/icons/spells/haste-sky-3.jpg`,
                            type: "feat",
                            flags: {
                                midiProperties: { magiceffect: true, spelleffect: true, }
                            },
                            data: {
                                activation: { type: "none", },
                                target: { type: "self", },
                                actionType: "save",
                                save: { dc: dc, ability: "wis", scaling: "flat" },
                            }
                        }
                        await workflow.actor.createEmbeddedDocuments("Item", [itemData]);
                        let saveItem = await workflow.actor.items.find(i => i.name === itemData.name);
                        let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
                        await workflow.actor.deleteEmbeddedDocuments("Item", [saveItem.id]);
                        if (saveWorkflow.failedSaves.size) {
                            const range = workflow.item.data.data.range.value ?? 5;
                                let newTargets = await canvas.tokens.placeables.filter((p) => 
                                    p?.actor && // exists
                                    p.document.uuid !== workflow.token.document.uuid && // not attacker
                                    p.document.uuid !== token.document.uuid && // not original target
                                    p.data.disposition !== workflow.token.data.disposition && // not friendly
                                    MidiQOL.getDistance(workflow.token, p, false) <= range && // within range
                                    canSee(workflow.token, p) // can see
                                );
                            if (newTargets.length === 0) {
                                return false;
                            } else if (newTargets.length === 1) {
                                if (isAttack) {
                                    let hook = Hooks.on("midi-qol.preAttackRoll", async (workflowNext) => {
                                        if (workflowNext.uuid === workflow.uuid) {
                                            workflowNext?.targets?.delete(token);
                                            workflowNext?.targets?.add(newTargets[0]);
                                            Hooks.off("midi-qol.preAttackRoll", hook);
                                        }
                                    });
                                } else if (isHarmSpell) {
                                    let hook = Hooks.on("midi-qol.preCheckSaves", async (workflowNext) => {
                                        if (workflowNext.uuid === workflow.uuid) {
                                            workflowNext?.targets?.delete(token);
                                            workflowNext?.hitTargets?.delete(token);
                                            workflowNext?.saves?.delete(token);
                                            workflowNext?.targets?.add(replaceTarget);
                                            workflowNext?.hitTargets?.add(replaceTarget);
                                            workflowNext?.saves?.add(replaceTarget);
                                            Hooks.off("midi-qol.preCheckSaves", hook);
                                        }
                                    });
                                }
                            }
                            let target_content = "";
                            for (let n; n < newTargets.length; n++) {
                                let target = newTargets[n];
                                target_content += `<label class="radio-label">
                                <input type="radio" name="target" value="${target.id}">
                                <img src="${target.data.img}" style="border:0px; width: 100px; height:100px;">
                                </label>`;
                            }
                            let content = `
                                    <style>
                                    .target .form-group {
                                    display: flex;
                                    flex-wrap: wrap;
                                    width: 100%;
                                    align-items: flex-start;
                                    }

                                    .target .radio-label {
                                    display: flex;
                                    flex-direction: column;
                                    align-items: center;
                                    text-align: center;
                                    justify-items: center;
                                    flex: 1 0 25%;
                                    line-height: normal;
                                    }
                
                                    .target .radio-label input {
                                    display: none;
                                    }
                
                                    .target img {
                                    border: 0px;
                                    width: 50px;
                                    height: 50px;
                                    flex: 0 0 50px;
                                    cursor: pointer;
                                    }
                
                                    /* CHECKED STYLES */
                                    .target [type=radio]:checked + img {
                                    outline: 2px solid #f00;
                                    }
                                    </style>
                                    <form class="target">
                                    <div class="form-group" id="target">
                                    ${target_content}
                                    </div>
                                    </form>
                            `;
                
                            let dialog = new Promise(async (resolve, reject) => {
                                new Dialog({
                                    title: "Sanctuary: Choose a new target",
                                    content,
                                    buttons: {
                                        Choose: {
                                            label: "Choose",
                                            callback: async () => {
                                                const selectedId = $("input[type='radio'][name='target']:checked").val();
                                                const replaceTarget = canvas.tokens.get(selectedId);
                                                if (isAttack) {
                                                    let hook = Hooks.on("midi-qol.preAttackRoll", async (workflowNext) => {
                                                        if (workflowNext.uuid === workflow.uuid) {
                                                                workflowNext?.targets?.delete(token);
                                                                workflowNext?.targets?.add(replaceTarget);
                                                                Hooks.off("midi-qol.preAttackRoll", hook);
                                                        }
                                                    });
                                                } else if (isHarmSpell && !isAttack) {
                                                    let hook = Hooks.on("midi-qol.preCheckSaves", async (workflowNext) => {
                                                        if (workflowNext.uuid === workflow.uuid) {
                                                            workflowNext?.targets?.delete(token);
                                                            workflowNext?.hitTargets?.delete(token);
                                                            workflowNext?.saves?.delete(token);
                                                            workflowNext?.targets?.add(replaceTarget);
                                                            workflowNext?.hitTargets?.add(replaceTarget);
                                                            workflowNext?.saves?.add(replaceTarget);
                                                            Hooks.off("midi-qol.preCheckSaves", hook);
                                                        }
                                                    });
                                                }
                                                resolve(true);
                                            }
                                        }
                                    }
                                }).render(true);
                            });
                            await dialog;
                            if (!dialog) return false;
                        }
                        console.warn("Sanctuary used");
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