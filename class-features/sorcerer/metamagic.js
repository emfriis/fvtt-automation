// metamagic

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

if (args[0].tag !== "OnUse" || lastArg.item.type !== "spell") return;

const usesItem = tactor.items.find(i => i.name === "Sorcery Points");
if (!usesItem || !usesItem.data.data.uses.value) return;

try {
    if (lastArg.macroPass === "preItemRoll" && ["action", "bonus", "reaction", "reactiondamage", "reactionmanual"].includes(args[0].item.data.activation.type)) {

        let metamagicContent = "";
        let carefulItem = tactor.items.find(i => i.name === "Metamagic: Careful Spell");
        if (carefulItem && args[0].item.data.save?.dc && args[0].item.data.save?.ability) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="careful"><img src="${carefulItem.data.img}" style="border:0px; width: 50px; height:50px;">Careful Spell<br>(1 Sorcery Point)</label>`;
        let distantItem = tactor.items.find(i => i.name === "Metamagic: Distant Spell");
        if (distantItem && (args[0].item.data.range?.value || args[0].item.data.range?.units === "touch")) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="distant"><img src="${distantItem.data.img}" style="border:0px; width: 50px; height:50px;">Distant Spell<br>(1 Sorcery Point)</label>`;
        let extendedItem = tactor.items.find(i => i.name === "Metamagic: Extended Spell");
        if (extendedItem && args[0].item.data.duration?.value) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="extended"><img src="${extendedItem.data.img}" style="border:0px; width: 50px; height:50px;">Extended Spell<br>(1 Sorcery Point)</label>`;
        let heightenedItem = tactor.items.find(i => i.name === "Metamagic: Heightened Spell")
        if (heightenedItem && args[0].item.data.save?.dc && args[0].item.data.save?.ability && usesItem.data.data.uses.value >= 3) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="heightened"><img src="${heightenedItem.data.img}" style="border:0px; width: 50px; height:50px;">Heightened Spell<br>(3 Sorcery Points)</label>`;
        let quickenedItem = tactor.items.find(i => i.name === "Metamagic: Quickened Spell") 
        if (quickenedItem && args[0].item.data.activation.type === "action" && !tactor.effects.find(i => i.data.label === "Bonus Action")) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="quickened"><img src="${quickenedItem.data.img}" style="border:0px; width: 50px; height:50px;">Quickened Spell<br>(1 Sorcery Point)</label>`;
        let subtleItem = tactor.items.find(i => i.name === "Metamagic: Subtle Spell");
        if (subtleItem && (args[0].item.data.components?.vocal || args[0].item.data.components?.somatic)) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="subtle"><img src="${subtleItem.data.img}" style="border:0px; width: 50px; height:50px;">Subtle Spell<br>(1 Sorcery Point)</label>`;
        let transmutedItem = tactor.items.find(i => i.name === "Metamagic: Transmuted Spell");
        if (transmutedItem && args[0].item.data.damage?.parts?.length && args[0].item.data.damage.parts.find(p => ["acid", "cold", "fire", "lightning", "poison", "thunder"].includes(p[1].toLowerCase()))) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="transmuted"><img src="${transmutedItem.data.img}" style="border:0px; width: 50px; height:50px;">Transmuted Spell<br>(1 Sorcery Point)</label>`;
        let twinnedItem = tactor.items.find(i => i.name === "Metamagic: Twinned Spell");
        if (twinnedItem && ["action", "bonus"].includes(args[0].item.data.activation.type) && ["ally", "creature", "enemy"].includes(args[0].item.data.target.type) && args[0].item.data.target.value === 1 && usesItem.data.data.uses.value >= Math.max(1, lastArg.spellLevel)) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="twinned"><img src="${twinnedItem.data.img}" style="border:0px; width: 50px; height:50px;">Twinned Spell (${Math.max(1, lastArg.spellLevel)}<br>Sorcery Point${Math.max(1, lastArg.spellLevel) > 1 ? "s" : ""})</label>`;
        if (metamagicContent === "") return;
        let content = `
            <style>
            .metamagic .form-group {
                display: flex;
                flex-wrap: wrap;
                width: 100%;
                align-items: flex-start;
            }

            .metamagic .radio-label {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                justify-items: center;
                flex: 1 0 25%;
                line-height: normal;
            }

            .metamagic .radio-label input {
                display: none;
            }

            .metamagic img {
                border: 0px;
                width: 50px;
                height: 50px;
                flex: 0 0 50px;
                cursor: pointer;
            }

            /* CHECKED STYLES */
            .metamagic [type=radio]:checked + img {
                outline: 2px solid #f00;
            }
            </style>
            <form class="metamagic">
            <div class="form-group" id="metamagics">
                ${metamagicContent}
            </div>
            <div>
                <p>(${usesItem.data.data.uses.value} Sorcery Point${usesItem.data.data.uses.value > 1 ? "s" : ""} Remaining)</p>
            </div>
            </form>
        `;
        let dialog = new Promise(async (resolve, reject) => {
            new Dialog({
                title: "Metamagic: Usage Configuration",
                content,
                buttons: {
                    Confirm: {
                        label: "Confirm",
                        callback: async () => {
                            let metamagic = $("input[type='radio'][name='metamagic']:checked").val();
                            resolve(metamagic);
                        },
                    },
                },
                default: "Confirm",
                close: async () => { resolve(false) },
            }).render(true);
        });
        let metamagic = await dialog;
        if (!metamagic) return;

        if (metamagic === "careful") {

            let carefulDialog =  new Promise(async (resolve, reject) => {
                new Dialog({
                    title: "Metamagic: Careful Spell",
                    content: `<p>Target any creatures you want to protect.<br>(Up to ${Math.max(1, tactor.data.data.abilities.cha.mod)} Creatures)</p>`,
                    buttons: {
                        Ok: {
                            label: "Ok",
                            callback: () => { resolve(Array.from(game.user?.targets)) },
                        },
                    },
                    default: "Ok",
                    close: () => { resolve(false) },
                }).render(true);
            });
            let targets = await carefulDialog;
		    if (!targets) return;
		    if (targets.length > Math.max(1, tactor.data.data.abilities.cha.mod)) return ui.notifications.warn(`Too many targets selected for Careful Spell (Maximum ${Math.max(1, tactor.data.data.abilities.cha.mod)})`);
	        let hook1 = Hooks.on("midi-qol.postCheckSaves", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    for (let t = 0; t < targets.length; t++) {
                        if (workflowNext.failedSaves.has(targets[t]) && !workflowNext.saves.has(targets[t])) {
                            workflowNext.failedSaves.delete(targets[t]);
                            workflowNext.saves.add(targets[t]);
                            workflowNext.saveDisplayData.find(d => d.target === targets[t]).saveString = "succeeds";
                        }
                    }
                    Hooks.off("midi-qol.postCheckSaves", hook1);
                }
            });
            let hook2 = Hooks.on("midi-qol.RollComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    Hooks.off("midi-qol.preambleComplete", hook1);
                    Hooks.off("midi-qol.RollComplete", hook2);
                    Hooks.off("midi-qol.preItemRoll", hook3);
                }
            });
            let hook3 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    Hooks.off("midi-qol.preambleComplete", hook1);
                    Hooks.off("midi-qol.RollComplete", hook2);
                    Hooks.off("midi-qol.preItemRoll", hook3);
                }
            });
            await usesItem.update({ "data.uses.value": usesItem.data.data.uses.value - 1 });

        } else if (metamagic === "distant") {
        
            const effectData = {
                changes: [{ key: "flags.midi-qol.distantSpell", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, },],
                disabled: false,
                label: "Metamagic: Distant Spell",
                flags: { dae: { specialDuration: ["1Spell"] } }
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
            await usesItem.update({ "data.uses.value": usesItem.data.data.uses.value - 1 });

        } else if (metamagic === "extended") {
        
            let value = args[0].item.data.duration.value;
            let efHook = Hooks.on("midi-qol.RollComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    let targets = Array.from(workflowNext.targets);
                    for (let t = 0; t < targets.length; t++) {
                        let token = targets[t];
                        let tactor = token.actor;
                        if (tactor) {
                            let effects = tactor.effects.filter(e => e.data.origin === args[0].uuid);
                            for (let e = 0; e < effects.length; e++) {
                                effect = effects[e];
                                if (effect && effect.data.label !== "Concentrating") await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: effect.id, duration: { seconds: (effect.data.duration.seconds ? effect.data.duration.seconds * 2 : null), turns: (effect.data.duration.turns ? effect.data.duration.turns * 2 : null), rounds: (effect.data.duration.rounds ? effect.data.duration.rounds * 2 : null), startTime: effect.data.duration.startTime, startTurn: effect.data.duration.startTurn, startRound: effect.data.duration.startRound } }] });
                            }
                        }
                    }
                    Hooks.off("midi-qol.RollComplete", efHook);
                }
            });
            let hook1 = Hooks.on("midi-qol.preambleComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    workflowNext.item.update({ "data.duration.value": value * 2 });
                    Hooks.off("midi-qol.preambleComplete", hook1);
                }
            });
            let hook2 = Hooks.on("midi-qol.RollComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    workflowNext.item.update({ "data.duration.value": value });
                    Hooks.off("midi-qol.preambleComplete", hook1);
                    Hooks.off("midi-qol.RollComplete", hook2);
                    Hooks.off("midi-qol.preItemRoll", hook3);
                }
            });
            let hook3 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    workflowNext.item.update({ "data.duration.value": value });
                    Hooks.off("midi-qol.preambleComplete", hook1);
                    Hooks.off("midi-qol.RollComplete", hook2);
                    Hooks.off("midi-qol.preItemRoll", hook3);
                }
            });
            await usesItem.update({ "data.uses.value": usesItem.data.data.uses.value - 1 });

        } else if (metamagic === "heightened") {

		    let heightenedDialog =  new Promise(async (resolve, reject) => {
                new Dialog({
                    title: "Metamagic: Heightened Spell",
                    content: `<p>Target a creature to weaken.</p>`,
                    buttons: {
                        Ok: {
                            label: "Ok",
                            callback: () => { resolve(Array.from(game.user?.targets)) },
                        },
                    },
                    default: "Ok",
                    close: () => { resolve(false) },
                }).render(true);
            });
            let targets = await heightenedDialog;
            if (!targets) return;
            if (targets.length !== 1) return ui.notifications.warn("More than one target selected");
            let hook1 = Hooks.on("midi-qol.preCheckSaves", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    if (workflowNext.targets.has(targets[0])) {
                        let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
                            if (actor === targets[0].actor && abilityId === args[0].item.data.save.ability) {
                                rollData.disadvantage = true;
                                Hooks.off("Actor5e.preRollAbilitySave", hook);
                            }
                        });
                    }
                    Hooks.off("midi-qol.preCheckSaves", hook1);
                }
            });
            let hook2 = Hooks.on("midi-qol.RollComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    Hooks.off("midi-qol.preambleComplete", hook1);
                    Hooks.off("midi-qol.RollComplete", hook2);
                    Hooks.off("midi-qol.preItemRoll", hook3);
                }
            });
            let hook3 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    Hooks.off("midi-qol.preambleComplete", hook1);
                    Hooks.off("midi-qol.RollComplete", hook2);
                    Hooks.off("midi-qol.preItemRoll", hook3);
                }
            });
            await usesItem.update({ "data.uses.value": usesItem.data.data.uses.value - 3 });

	    } else if (metamagic === "quickened") {

            if (game.combat) await game.dfreds.effectInterface.addEffect({ effectName: "Bonus Action", uuid: tactor.uuid });
            await usesItem.update({ "data.uses.value": usesItem.data.data.uses.value - 1 });

        } else if (metamagic === "transmuted") {

            let options = ["acid", "cold", "fire", "lightning", "poison", "thunder"];
            const optionContent = options.map((o) => { return `<option value="${o}">${CONFIG.DND5E.damageTypes[o]}</option>` })
            const content = `
            <div class="form-group">
            <label>Damage Types: </label>
            <select name="types"}>
            ${optionContent}
            </select>
            </div>
            `;
            let transmutedDialog =  new Promise(async (resolve, reject) => {
                new Dialog({
                    title: "Metamagic: Transmuted Spell",
                    content,
                    buttons: {
                        Ok: {
                            label: "Ok",
                            callback: (html) => {resolve(html.find("[name=types]")[0].value)},
                        },
                    },
                    default: "Ok",
                    close: () => { resolve(false) },
                }).render(true);
            });
            let type = await transmutedDialog;
            if (!type) return;
            let parts = args[0].item.data.damage.parts;
            let hook1 = Hooks.on("midi-qol.preambleComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    workflowNext.defaultDamageType = type;
                    workflowNext.item.data.damage.parts.forEach(part => {
                        if (!["acid", "cold", "fire", "lightning", "poison", "thunder"].includes(part[1].toLowerCase())) return;
                        part[0] = part[0].replace(/\[(.*)\]/g, `[${type}]`);
                        part[1] = type;
                    });
                    Hooks.off("midi-qol.preambleComplete", hook1);
                }
            });
            let hook2 = Hooks.on("midi-qol.RollComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    workflowNext.item.update({ "data.damage.parts": parts });
                    Hooks.off("midi-qol.preambleComplete", hook1);
                    Hooks.off("midi-qol.RollComplete", hook2);
                    Hooks.off("midi-qol.preItemRoll", hook3);
                }
            });
            let hook3 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    workflowNext.item.update({ "data.damage.parts": parts });
                    Hooks.off("midi-qol.preambleComplete", hook1);
                    Hooks.off("midi-qol.RollComplete", hook2);
                    Hooks.off("midi-qol.preItemRoll", hook3);
                }
            });
            await usesItem.update({ "data.uses.value": usesItem.data.data.uses.value - 1 });

        } else if (metamagic === "subtle") {

            const effectData = {
                changes: [{ key: "flags.midi-qol.subtleSpell", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, },],
                disabled: false,
                label: "Metamagic: Subtle Spell",
                flags: { dae: { specialDuration: ["1Spell"] } }
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
            await usesItem.update({ "data.uses.value": usesItem.data.data.uses.value - 1 });

	    } else if (metamagic === "twinned") {

            await usesItem.update({ "data.uses.value": usesItem.data.data.uses.value - Math.max(1, lastArg.spellLevel) });

        }

    } else if (lastArg.macroPass === "postAttackRoll" && ["msak","rsak"].includes(args[0].item.data.actionType) && usesItem.data.data.uses.value >= 2) {

	    if (!(tactor.items.find(i => i.name === "Metamagic: Seeking Spell"))) return;
        if (args[0].attackRoll.total >= args[0].targets.map(t => t.actor.data.data.attributes.ac.value).reduce((prv, val) => { return (prv > val ? prv : val) })) return;
        let seekingDialog =  new Promise(async (resolve, reject) => {
                new Dialog({
                    title: "Metamagic: Seeking Spell",
                    content: `<p>Use Seeking Spell to reroll the Attack Roll? (2 Sorcery Points)<br>(${usesItem.data.data.uses.value} Sorcery Points Remaining)</p>`,
                    buttons: {
                        Ok: {
                            label: "Ok",
                            callback: () => {resolve(true)},
                        },
                    },
                    default: "Ok",
                    close: () => { resolve(false) },
                }).render(true);
            });
            let seek = await seekingDialog;
            if (!seek) return;
            let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
            // RENDER NEW ATTACK ROLL AND ASSIGN TO WORKFLOW - NEED TO UPDATE attackRoll AND attackRollHTML
            await usesItem.update({ "data.uses.value": usesItem.data.data.uses.value - 2 });

    } else if (lastArg.macroPass === "postDamageRoll" && ["action", "bonus", "reaction", "reactiondamage", "reactionmanual"].includes(args[0].item.data.activation.type)) {
        
        if (!(tactor.items.find(i => i.name === "Metamagic: Empowered Spell") && args[0].item.data.damage?.parts?.length && !["healing", "temphp"].includes(args[0].item.data.damage.parts[0][1]))) return;
        let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
        let diceResults = workflow.damageRoll.dice[0].results;
        let die_content = "";
        for (let i = 0; i < diceResults.length; i++) {
            if (diceResults[i]?.rerolled) continue;
            die_content += `<input type='checkbox' id='die${i}' name='die' value='${diceResults[i].result},${diceResults[i].formula}'/>
            <label class='checkbox-label' for='die${i}'><img src="icons/svg/d${workflow.damageRoll.dice[0].faces}-grey.svg" style="border:0px; width: 50px; height:50px;">${diceResults[i].result}</label>
            `;
        };
        let content = `
            <style>
            .dice .form-group {
                display: flex;
                flex-wrap: wrap;
                width: 100%;
                align-items: flex-start;
            }

            .dice .checkbox-label {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                justify-items: center;
                flex: 1 0 25%;
                line-height: normal;
            }

            .dice .checkbox-label input {
                display: none;
            }

            .dice img {
                border: 0px;
                width: 50px;
                height: 50px;
                flex: 0 0 50px;
                cursor: pointer;
            }

            /* CHECKED STYLES */
            .dice [type=radio]:checked + img {
                outline: 2px solid #f00;
            }
            </style>
            <form class="dice">
        <div>
            <p>Choose up to ${Math.max(1, tactor.data.data.abilities.cha.mod)} damage dice to reroll:</p>
        </div>
            <div class="form-group" id="dice-group">
                ${die_content}
            </div>
        <div>
            <p>(${usesItem.data.data.uses.value} Sorcery Points Remaining)</p>
        </div>
            </form>
        `;
        let heightenedRerolls = await new Promise((resolve, reject) => {
            new Dialog({
                title: "Metamagic: Heightened Spell",
                content,
                buttons: {
                    Ok: {
                        label: "Ok",
                        callback: async () => {
                    let checked = [];
                    $("input[type='checkbox'][name='die']:checked").each(function() { 
                        let rollData = $(this).val.split(",");
                        checked.push({ result: rollData[0], rollable: rollData[1] }); 
                    });
                    resolve(checked);
                },
                    },
                    Cancel: {
                        label: "Cancel",
                        callback: async () => {resolve(false)},
                    },
                },
                default: "Cancel",
                close: () => {resolve(false)}
            }).render(true);
        });
        let rerolls = await heightenedRerolls;
        if (!rerolls) return;
        if (rerolls.length > Math.max(1, tactor.data.data.abilities.cha.mod)) return ui.notifications.warn(`Too many dice selected (Maximum ${Math.max(1, tactor.data.data.abilities.cha.mod)})`);
	    for (let r = 0; r < rerolls.length; r++) {
            let rollData = rerolls[r];
            let newRoll = new Roll(rollData.rollable).evaluate({ async: false });
            if (game.dice3d) game.dice3d.showForRoll(newRoll);
            let replaceRoll = workflow.damageRoll.dice.find(diceData => diceData.results.find(d => d.result === rollData.total));
            if (!replaceRoll) continue;
            let replaceResult = replaceDie.result;
            replaceDie.result = newRoll.total;
            workflow.damageRoll.total = workflow.damageRoll.total + newRoll.total - replaceResult;
            workflow.damageRoll._total = workflow.damageRoll._total + newRoll.total - replaceResult;
            workflow.damageRollHTML = await workflow.damageRoll.render();
        }

    }
} catch (err) {
    console.error("Metamagic macro error", err);
}