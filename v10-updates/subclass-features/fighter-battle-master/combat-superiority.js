try {
    const usesItem = args[0].actor.items.find(i => i.name == "Combat Superiority" && i.system.uses.value);
	const die = args[0].actor.system.scale["battle-master"]["combat-superiority"];
	const saveDC = 8 + args[0].actor.system.attributes.prof + (args[0].actor.system.abilities.dex.mod > args[0].actor.system.abilities.str.mod ? args[0].actor.system.abilities.dex.mod : args[0].actor.system.abilities.str.mod);
    if (!usesItem || !die) return;
	if (args[0].macroPass == "prTargeting" && !args[0].workflow.combatSuperiority && ["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType)) {
		let maneuverContent = "";
		let lungingAttackItem = args[0].actor.items.find(i => i.name == "Maneuver: Lunging Attack");
        if (lungingAttackItem && ["mwak"].includes(args[0].item.system.actionType)) maneuverContent += `<label class="radio-label"><br><input type="radio" name="maneuver" value="lungingAttack"><img src="${lungingAttackItem.img}" style="border:0px; width: 50px; height:50px;">Lunging Attack</label>`;
		let content = `
            <style>
            .maneuver .form-group {display: flex; flex-wrap: wrap; width: 100%; align-items: flex-start;}
            .maneuver .radio-label { display: flex; flex-direction: column; align-items: center; text-align: center; justify-items: center; flex: 1 0 25%; line-height: normal;}
            .maneuver .radio-label input {display: none;}
            .maneuver img {border: 0px; width: 50px; height: 50px; flex: 0 0 50px; cursor: pointer;}
            .maneuver [type=radio]:checked + img {outline: 2px solid #f00;}
            </style>
            <form class="maneuver">
                <div class="form-group" id="maneuvers">${maneuverContent}</div>
                <div><p>(${usesItem.system.uses.value} Superiority Di${usesItem.system.uses.value > 1 ? "e" : "ce"} Remaining)</p></div>
            </form>
        `;
        let dialog = new Promise(async (resolve) => {
            new Dialog({
                title: "Combat Superiority",
                content,
                buttons: {
                    Confirm: {
                        label: "Confirm",
                        callback: async () => {
                            let maneuver = $("input[type='radio'][name='maneuver']:checked").val();
                            resolve(maneuver);
                        },
                    },
                    Cancel: {
                        label: "Cancel",
                        callback: async () => {
                            resolve(false);
                        },
                    },
                },
                default: "Cancel",
                close: async () => { resolve(false) },
            }).render(true);
        });
        let maneuver = await dialog;
        if (!maneuver) return;
		args[0].workflow.combatSuperiority = maneuver;
		await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
		if (maneuver == "lungingAttack") {
			const effectData = {
                changes: [{ key: `flags.midi-qol.range.${args[0].item.system.actionType}`, mode: 2, value: "+5", priority: 20 }],
                disabled: false,
                name: "Lunging Attack",
                icon: "icons/weapons/polearms/spear-hooked-spike.webp",
                duration: { seconds: 1 },
                flags: { dae: { specialDuration: ["endCombat", "1Attack", "1Hit"] } }
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
		} 
	} if (args[0].macroPass == "preAttackRoll" && !args[0].workflow.combatSuperiority && ["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType)) {
		let maneuverContent = "";
		let braceItem = args[0].actor.items.find(i => i.name == "Maneuver: Brace");
        if (braceItem && ["mwak"].includes(args[0].item.system.actionType)) maneuverContent += `<label class="radio-label"><br><input type="radio" name="maneuver" value="brace"><img src="${braceItem.img}" style="border:0px; width: 50px; height:50px;">Brace</label>`;
        let feintingAttackItem = args[0].actor.items.find(i => i.name == "Maneuver: Feinting Attack");
        if (feintingAttackItem && ["mwak", "rwak"].includes(args[0].item.system.actionType) && !args[0].actor.effects.find(e => e.name == "Bonus Action")) maneuverContent += `<label class="radio-label"><br><input type="radio" name="maneuver" value="feintingAttack"><img src="${feintingAttackItem.img}" style="border:0px; width: 50px; height:50px;">Feinting Attack</label>`;
        let quickTossItem = args[0].actor.items.find(i => i.name == "Maneuver: Quick Toss");
        if (quickTossItem && ["mwak", "rwak"].includes(args[0].item.system.actionType) && args[0].item.system.properties.thr && !args[0].actor.effects.find(e => e.name == "Bonus Action")) maneuverContent += `<label class="radio-label"><br><input type="radio" name="maneuver" value="quickToss"><img src="${quickTossItem.img}" style="border:0px; width: 50px; height:50px;">Quick Toss</label>`;
		let content = `
            <style>
            .maneuver .form-group {display: flex; flex-wrap: wrap; width: 100%; align-items: flex-start;}
            .maneuver .radio-label { display: flex; flex-direction: column; align-items: center; text-align: center; justify-items: center; flex: 1 0 25%; line-height: normal;}
            .maneuver .radio-label input {display: none;}
            .maneuver img {border: 0px; width: 50px; height: 50px; flex: 0 0 50px; cursor: pointer;}
            .maneuver [type=radio]:checked + img {outline: 2px solid #f00;}
            </style>
            <form class="maneuver">
                <div class="form-group" id="maneuvers">${maneuverContent}</div>
                <div><p>(${usesItem.system.uses.value} Superiority Di${usesItem.system.uses.value > 1 ? "e" : "ce"} Remaining)</p></div>
            </form>
        `;
        let dialog = new Promise(async (resolve) => {
            new Dialog({
                title: "Combat Superiority",
                content,
                buttons: {
                    Confirm: {
                        label: "Confirm",
                        callback: async () => {
                            let maneuver = $("input[type='radio'][name='maneuver']:checked").val();
                            resolve(maneuver);
                        },
                    },
                    Cancel: {
                        label: "Cancel",
                        callback: async () => {
                            resolve(false);
                        },
                    },
                },
                default: "Cancel",
                close: async () => { resolve(false) },
            }).render(true);
        });
        let maneuver = await dialog;
        if (!maneuver) return;
		args[0].workflow.combatSuperiority = maneuver;
		await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
		if (maneuver == "feintingAttack") {
			if (game.combat) await game.dfreds.effectInterface.addEffect({ effectName: "Bonus Action", uuid: args[0].actor.uuid });
			args[0].workflow.advantage = true;
			args[0].workflow.attackRoll.advantage = true;
		} else if (maneuver == "quickToss") {
			if (game.combat) await game.dfreds.effectInterface.addEffect({ effectName: "Bonus Action", uuid: args[0].actor.uuid });
		}
	} else if (args[0].macroPass == "preCheckHits" && !args[0].isFumble && !args[0].isCritical && !args[0].workflow.combatSuperiority && ["mwak", "rwak"].includes(args[0].item.system.actionType)) {
		let maneuverContent = "";
		let precisionAttackItem = args[0].actor.items.find(i => i.name == "Maneuver: Precision Attack");
        if (precisionAttackItem && ["mwak", "rwak"].includes(args[0].item.system.actionType)) maneuverContent += `<label class="radio-label"><br><input type="radio" name="maneuver" value="precisionAttack"><img src="${precisionAttackItem.img}" style="border:0px; width: 50px; height:50px;">Precision Attack</label>`;
		let content = `
            <style>
            .maneuver .form-group {display: flex; flex-wrap: wrap; width: 100%; align-items: flex-start;}
            .maneuver .radio-label { display: flex; flex-direction: column; align-items: center; text-align: center; justify-items: center; flex: 1 0 25%; line-height: normal;}
            .maneuver .radio-label input {display: none;}
            .maneuver img {border: 0px; width: 50px; height: 50px; flex: 0 0 50px; cursor: pointer;}
            .maneuver [type=radio]:checked + img {outline: 2px solid #f00;}
            </style>
            <form class="maneuver">
                <div class="form-group" id="maneuvers">${maneuverContent}</div>
				<div><p>(Attack Roll Total: ${args[0].attackRoll._total})</p></div>
                <div><p>(${usesItem.system.uses.value} Superiority Di${usesItem.system.uses.value > 1 ? "e" : "ce"} Remaining)</p></div>
            </form>
        `;
        let dialog = new Promise(async (resolve) => {
            new Dialog({
                title: "Combat Superiority",
                content,
                buttons: {
                    Confirm: {
                        label: "Confirm",
                        callback: async () => {
                            let maneuver = $("input[type='radio'][name='maneuver']:checked").val();
                            resolve(maneuver);
                        },
                    },
                    Cancel: {
                        label: "Cancel",
                        callback: async () => {
                            resolve(false);
                        },
                    },
                },
                default: "Cancel",
                close: async () => { resolve(false) },
            }).render(true);
        });
        let maneuver = await dialog;
        if (!maneuver) return;
		args[0].workflow.combatSuperiority = maneuver;
		await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
		if (maneuver == "precisionAttack") {
			let bonusRoll = await new Roll('0 + ' + `1${die}`).evaluate({async: true});
			if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
			for (let i = 1; i < bonusRoll.terms.length; i++) {
				args[0].attackRoll.terms.push(bonusRoll.terms[i]);
			}
			args[0].attackRoll._total += bonusRoll.total;
			args[0].attackRoll._formula = args[0].attackRoll._formula + ' + ' + `1${die}`;
			await args[0].workflow.setAttackRoll(args[0].attackRoll);
		}
    } else if (args[0].macroPass == "postDamageRoll" && (args[0].hitTargets.length || MidiQOL.configSettings().autoRollDamage != "always") && ["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType)) {
        if (args[0].workflow.combatSuperiority) {
			if (["brace", "feintingAttack", "lungingAttack", "quickToss"].includes(args[0].workflow.combatSuperiority)) {
				let diceMult = args[0].isCritical ? 2 : 1;
                let bonusRoll = await new Roll('0 + ' + `${diceMult}${die}`).evaluate({async: true});
				if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
				for (let i = 1; i < bonusRoll.terms.length; i++) {
					args[0].damageRoll.terms.push(bonusRoll.terms[i]);
				}
				args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${diceMult}${die}`;
				args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
				await args[0].workflow.setDamageRoll(args[0].damageRoll);
			}
			return;
		}
		let maneuverContent = "";
        let disarmingAttackItem = args[0].actor.items.find(i => i.name == "Maneuver: Disarming Attack");
        if (disarmingAttackItem && ["mwak", "rwak"].includes(args[0].item.system.actionType)) maneuverContent += `<label class="radio-label"><br><input type="radio" name="maneuver" value="disarmingAttack"><img src="${disarmingAttackItem.img}" style="border:0px; width: 50px; height:50px;">Disarming Attack</label>`;
        let distractingStrikeItem = args[0].actor.items.find(i => i.name == "Maneuver: Distracting Strike");
        if (distractingStrikeItem && ["mwak", "rwak"].includes(args[0].item.system.actionType)) maneuverContent += `<label class="radio-label"><br><input type="radio" name="maneuver" value="distractingStrike"><img src="${distractingStrikeItem.img}" style="border:0px; width: 50px; height:50px;">Distracting Strike</label>`;
        let goadingAttackItem = args[0].actor.items.find(i => i.name == "Maneuver: Goading Attack");
        if (goadingAttackItem && ["mwak", "rwak"].includes(args[0].item.system.actionType)) maneuverContent += `<label class="radio-label"><br><input type="radio" name="maneuver" value="goadingAttack"><img src="${goadingAttackItem.img}" style="border:0px; width: 50px; height:50px;">Goading Attack</label>`;
        let maneuveringAttackItem = args[0].actor.items.find(i => i.name == "Maneuver: Maneuvering Attack");
        if (maneuveringAttackItem && ["mwak", "rwak"].includes(args[0].item.system.actionType)) maneuverContent += `<label class="radio-label"><br><input type="radio" name="maneuver" value="maneuveringAttack"><img src="${maneuveringAttackItem.img}" style="border:0px; width: 50px; height:50px;">Maneuvering Attack</label>`;
        let menacingAttackItem = args[0].actor.items.find(i => i.name == "Maneuver: Menacing Attack");
        if (menacingAttackItem && ["mwak", "rwak"].includes(args[0].item.system.actionType)) maneuverContent += `<label class="radio-label"><br><input type="radio" name="maneuver" value="menacingAttack"><img src="${menacingAttackItem.img}" style="border:0px; width: 50px; height:50px;">Menacing Attack</label>`;
        let pushingAttackItem = args[0].actor.items.find(i => i.name == "Maneuver: Pushing Attack");
        if (pushingAttackItem && ["mwak", "rwak"].includes(args[0].item.system.actionType)) maneuverContent += `<label class="radio-label"><br><input type="radio" name="maneuver" value="pushingAttack"><img src="${pushingAttackItem.img}" style="border:0px; width: 50px; height:50px;">Pushing Attack</label>`;
        let sweepingAttackItem = args[0].actor.items.find(i => i.name == "Maneuver: Sweeping Attack");
        if (sweepingAttackItem && ["mwak"].includes(args[0].item.system.actionType)) maneuverContent += `<label class="radio-label"><br><input type="radio" name="maneuver" value="sweepingAttack"><img src="${sweepingAttackItem.img}" style="border:0px; width: 50px; height:50px;">Sweeping Attack</label>`;
        let tripAttackItem = args[0].actor.items.find(i => i.name == "Maneuver: Trip Attack");
        if (tripAttackItem && ["mwak", "rwak"].includes(args[0].item.system.actionType)) maneuverContent += `<label class="radio-label"><br><input type="radio" name="maneuver" value="tripAttack"><img src="${tripAttackItem.img}" style="border:0px; width: 50px; height:50px;">Trip Attack</label>`;
		if (maneuverContent == "") return;
        let content = `
            <style>
            .maneuver .form-group {display: flex; flex-wrap: wrap; width: 100%; align-items: flex-start;}
            .maneuver .radio-label { display: flex; flex-direction: column; align-items: center; text-align: center; justify-items: center; flex: 1 0 25%; line-height: normal;}
            .maneuver .radio-label input {display: none;}
            .maneuver img {border: 0px; width: 50px; height: 50px; flex: 0 0 50px; cursor: pointer;}
            .maneuver [type=radio]:checked + img {outline: 2px solid #f00;}
            </style>
            <form class="maneuver">
                <div class="form-group" id="maneuvers">${maneuverContent}</div>
                <div><p>(${usesItem.system.uses.value} Superiority Di${usesItem.system.uses.value > 1 ? "e" : "ce"} Remaining)</p></div>
            </form>
        `;
        let dialog = new Promise(async (resolve) => {
            new Dialog({
                title: "Combat Superiority",
                content,
                buttons: {
                    Confirm: {
                        label: "Confirm",
                        callback: async () => {
                            let maneuver = $("input[type='radio'][name='maneuver']:checked").val();
                            resolve(maneuver);
                        },
                    },
                    Cancel: {
                        label: "Cancel",
                        callback: async () => {
                            resolve(false);
                        },
                    },
                },
                default: "Cancel",
                close: async () => { resolve(false) },
            }).render(true);
        });
        let maneuver = await dialog;
        if (!maneuver) return;
		args[0].workflow.combatSuperiority = maneuver;
		await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
		if (["sweepingAttack"].includes(maneuver)) return;
        let diceMult = args[0].isCritical ? 2 : 1;
		let bonusRoll = await new Roll('0 + ' + `${diceMult}${die}`).evaluate({async: true});
		if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
		for (let i = 1; i < bonusRoll.terms.length; i++) {
			args[0].damageRoll.terms.push(bonusRoll.terms[i]);
		}
		args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${diceMult}${die}`;
		args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
		await args[0].workflow.setDamageRoll(args[0].damageRoll);
	} else if (args[0].macroPass == "postActiveEffects" && (args[0].hitTargets.length || MidiQOL.configSettings().autoRollDamage != "always") && ["disarmingAttack", "distractingStrike", "goadingAttack", "menacingAttack", "pushingAttack", "sweepingAttack", "tripAttack"].includes(args[0].workflow.combatSuperiority)) {
		const itemData = {
			type: "feat",
			flags: { autoanimations: { isEnabled: false }, "midi-qol": {} },
			system: {
				activation: { type: "special" },
				target: { type: "creature" },
                save: {},
                damage: {}
			}
		}
        if (["disarmingAttack", "distractingStrike", "goadingAttack", "menacingAttack", "pushingAttack", "tripAttack"].includes(args[0].workflow.combatSuperiority)) {
            if (args[0].workflow.combatSuperiority == "disarmingAttack") {
                itemData.name = "Disarming Attack";
                itemData.img = "icons/skills/melee/sword-damaged-broken-orange.webp";
                itemData.system.actionType = "save";
                itemData.system.save =  { ability: "str", dc: `${saveDC}`, scaling: "flat" };
            } else if (args[0].workflow.combatSuperiority == "distractingStrike") {
                itemData.name = "Distracting Strike";
                itemData.img = "icons/skills/melee/shield-damaged-broken-orange.webp";
                itemData.system.actionType = "other";
                itemData.effects = [{
                    changes: [{ key: "flags.midi-qol.grants.advantage.attack.all", mode: 0, value: `actorUuid!="${args[0].actor.uuid}"`, priority: 20 }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "RemoveEffectPostAttacked, isAttacked", priority: 20 }], 
                    disabled: false, 
                    transfer: false,
                    isSuppressed: false,
                    icon: "icons/skills/melee/shield-damaged-broken-orange.webp", 
                    name: "Distracting Strike", 
                    duration: { seconds: 7, rounds: 1 },
                    flags: { dae: { specialDuration: ["turnStartSource", "combatEnd"] } }
                }];
            } else if (args[0].workflow.combatSuperiority == "goadingAttack") {
                itemData.name = "Goading Attack";
                itemData.img = "icons/skills/wounds/injury-face-impact-orange.webp";
                itemData.system.actionType = "save";
                itemData.system.save = { ability: "wis", dc: `${saveDC}`, scaling: "flat" };
                itemData.effects = [{
                    changes: [{ key: "flags.midi-qol.disadvantage.attack.all", mode: 0, value: `targetActorUuid!=${args[0].actor.uuid}`, priority: 20 }], 
                    disabled: false, 
                    transfer: false,
                    isSuppressed: false,
                    icon: "icons/skills/wounds/injury-face-impact-orange.webp", 
                    name: "Goading Attack", 
                    duration: { seconds: 7, rounds: 1, turns: 1 },
                    flags: { dae: { specialDuration: ["turnEndSource", "combatEnd"] } }
                }];
            } else if (args[0].workflow.combatSuperiority == "menacingAttack") {
                itemData.name = "Menacing Attack";
                itemData.img = "icons/magic/fire/flame-burning-skull-orange.webp";
                itemData.system.actionType = "save";
                itemData.system.save = { ability: "wis", dc: `${saveDC}`, scaling: "flat" };
                itemData.effects = [{
                    changes: [{ key: "macro.CE", mode: 0, value: "Frightened", priority: 20 }], 
                    disabled: false, 
                    transfer: false,
                    isSuppressed: false,
                    icon: "icons/magic/fire/flame-burning-skull-orange.webp", 
                    name: "Menacing Attack", 
                    duration: { seconds: 7, rounds: 1, turns: 1 },
                    flags: { dae: { specialDuration: ["turnEndSource", "combatEnd"] } }
                }];
                itemData.system.activation.condition = "!target.traits.ci.value.has('frightened')";
                itemData.flags["midi-qol"].effectActivation = true;
            } else if (args[0].workflow.combatSuperiority == "pushingAttack") {
                itemData.name = "icons/skills/melee/strike-flail-destructive-yellow.webp";
                itemData.img = "Pushing Attack";
                itemData.system.actionType = "save";
                itemData.system.save = { ability: "str", dc: `${saveDC}`, scaling: "flat" };
            } else if (args[0].workflow.combatSuperiority == "tripAttack") {
                itemData.name = "Trip Attack";
                itemData.img = "icons/skills/melee/shield-damaged-broken-gold.webp";
                itemData.system.actionType = "save";
                itemData.system.save = { ability: "str", dc: `${saveDC}`, scaling: "flat" };
                itemData.effects = [{
                    changes: [{ key: "StatusEffect", mode: 0, value: "Convenient Effect: Prone", priority: 20 }], 
                    disabled: false, 
                    transfer: false,
                    isSuppressed: false,
                    icon: "icons/svg/falling.svg", 
                    name: "Prone"
                }];
                itemData.system.activation.condition = "!target.effects.find(e=>e.name=='Prone')";
                itemData.flags["midi-qol"].effectActivation = true;
            }
		    const item = new CONFIG.Item.documentClass(itemData, { parent: args[0].actor });
                await MidiQOL.completeItemRoll(item, {}, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [args[0].targetUuids[0]] });
		} else if (["sweepingAttack"].includes(args[0].workflow.combatSuperiority)) {
            if (args[0].workflow.combatSuperiority == "sweepingAttack") {
                let sweepingDialog =  new Promise(async (resolve) => {
                    new Dialog({
                        title: "Sweeping Attack",
                        content: `<p>Target another creature to damage.</p>`,
                        buttons: {
                            Confirm: {
                                label: "Confirm",
                                callback: () => { resolve(Array.from(game.user?.targets)) },
                            },
                        },
                        default: "Confirm",
                        close: () => { resolve(false) },
                    }).render(true);
                });
                let targets = await sweepingDialog;
                if (!targets || targets.length != 1) return ui.notifications.warn("Invalid number of targets selected");
                if (MidiQOL.computeDistance(args[0].workflow.token, targets[0], false) >= 10 || MidiQOL.computeDistance(args[0].targets[0], targets[0], false) >= 10) return ui.notifications.warn("Target too far from attacker or original target");
                if (targets[0].actor.system.attributes.ac.value > args[0].attackRoll._total) return;
                itemData.name = "Sweeping Attack";
                itemData.img = "icons/weapons/axes/axe-battle-orange.webp";
                itemData.system.actionType = "other";
                itemData.system.damage.parts = [[`1${die}`, `${args[0].workflow.defaultDamageType.toLowerCase()}`]];
                const item = new CONFIG.Item.documentClass(itemData, { parent: args[0].actor });
                await MidiQOL.completeItemRoll(item, {}, { showFullCard: true, createWorkflow: true, configureDialog: false, targetUuids: [targets[0].document.uuid] });
            }
		}
	}
} catch (err) {console.error("Combat Superiority Macro - ", err)}