// metamagic
// effect on use pre item roll
// effect on use pre attack roll
// effect on use post damage roll

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

const usesItem = tactor.items.find(i => i.name === "Sorcery Points");
if (!usesItem || !usesItem.data.data.uses.value) return;

if (args[0].tag !== "OnUse") {
    let seekingEffect = tactor.effects.find(e => e.data.label === "Metamagic: Seeking Spell");
    if (seekingEffect) {
        await usesItem.update({ "data.uses.value": Math.max(0, usesItem.data.data.uses.value - 2) });
        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [seekingEffect.id] });
    }
}

if (args[0].tag !== "OnUse" || lastArg.item.type !== "spell") return;

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
        if (heightenedItem && args[0].item.data.save?.dc && args[0].item.data.actionType === "save" && usesItem.data.data.uses.value >= 3) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="heightened"><img src="${heightenedItem.data.img}" style="border:0px; width: 50px; height:50px;">Heightened Spell<br>(3 Sorcery Points)</label>`;
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

            // careful spell
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
            await usesItem.update({ "data.uses.value": Math.max(0, usesItem.data.data.uses.value - 1) });

        } else if (metamagic === "distant") {
        
            const effectData = {
                changes: [{ key: "flags.midi-qol.distantSpell", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, },],
                disabled: false,
                label: "Metamagic: Distant Spell",
                flags: { dae: { specialDuration: ["turnEnd","turnStart"] } }
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
            await usesItem.update({ "data.uses.value": Math.max(0, usesItem.data.data.uses.value - 1) });

        } else if (metamagic === "extended") {
        
            // extended spell
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
            await usesItem.update({ "data.uses.value": Math.max(0, usesItem.data.data.uses.value - 1) });

        } else if (metamagic === "heightened") {

            // heightened spell
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
                    if (workflowNext.hitTargets.has(targets[0])) {
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
            await usesItem.update({ "data.uses.value": Math.max(0, usesItem.data.data.uses.value - 3) });

	    } else if (metamagic === "quickened") {

            if (game.combat) await game.dfreds.effectInterface.addEffect({ effectName: "Bonus Action", uuid: tactor.uuid });
            await usesItem.update({ "data.uses.value": Math.max(0, usesItem.data.data.uses.value - 1) });

        } else if (metamagic === "transmuted") {

            // transmuted spell
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
                    workflowNext.item.data.data.damage.parts.forEach(part => {
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
            await usesItem.update({ "data.uses.value": Math.max(0, usesItem.data.data.uses.value - 1) });

        } else if (metamagic === "subtle") {

            // subtle spell
            const effectData = {
                changes: [{ key: "flags.midi-qol.subtleSpell", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, },],
                disabled: false,
                label: "Metamagic: Subtle Spell",
                flags: { dae: { specialDuration: ["1Spell"] } }
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
            await usesItem.update({ "data.uses.value": usesItem.data.data.uses.value - 1 });

	    } else if (metamagic === "twinned") {

            // twinned spell
            await usesItem.update({ "data.uses.value": Math.max(1, usesItem.data.data.uses.value - lastArg.spellLevel) });

        }

    } else if (lastArg.macroPass === "preAttackRoll" && ["msak","rsak"].includes(lastArg.item.data.actionType)) {
        
        // seeking spell
        if (!tactor.items.find(i => i.name === "Metamagic: Seeking Spell") || usesItem.data.data.uses.value < 2) return;
        const effectData = {
            changes: [
                { key: "flags.midi-qol.optional.seekingSpell.count", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "every", priority: 20, },
                { key: "flags.midi-qol.optional.seekingSpell.label", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "Metamagic: Seeking Spell", priority: 20, },
                { key: "flags.midi-qol.optional.seekingSpell.attack.fail", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "reroll", priority: 20, },
                { key: "flags.midi-qol.optional.seekingSpell.macroToCall", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: "ItemMacro.Metamagic", priority: 20, },
            ],
            disabled: false,
            flags: { dae: { specialDuration: ["1Attack", "1Spell"] } },
            icon: "icons/magic/light/projectile-flare-blue.webp",
            label: "Metamagic: Seeking Spell",
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
    
    } else if (lastArg.macroPass === "postDamageRoll" && args[0].hitTargets.length) {

        // empowered spell
        if (!(tactor.items.find(i => i.name === "Metamagic: Empowered Spell") && args[0].item.data.damage?.parts?.length && !["healing", "temphp"].includes(args[0].item.data.damage.parts[0][1]))) return;
        let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
        let dice = workflow.damageRoll.dice;
        let die_content = "";
        for (let d = 0; d < dice.length; d++) {
            let results = dice[d].results;
            for (let r = 0; r < results.length; r++) {
                if (results[r]?.rerolled) continue;
                die_content += `<label class='checkbox-label' for='die${d}${r}'>
                <input type='checkbox' id='die${d}${r}' name='die' value='${results[r].result},${dice[d].faces},${d}'/>
                <img src="icons/svg/d${workflow.damageRoll.dice[d].faces}-grey.svg" style="border:0px; width: 50px; height:50px;">
                ${results[r].result} (1d${dice[d].faces} ${dice[d].flavor})
                </label>
                `;
            }
        }
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
        .dice .check-label input {
            display: none;
        }
        .dice img {
            border: 0px;
            width: 50px;
            height: 50px;
            flex: 0 0 50px;
            cursor: pointer;
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
        let empoweredRerolls = await new Promise((resolve, reject) => {
            new Dialog({
                title: "Metamagic: Heightened Spell",
                content,
                buttons: {
                    Ok: {
                        label: "Ok",
                        callback: async () => {
                            let rerolls = [];
                            let checked = $("input[type='checkbox'][name='die']:checked"); 
                            for (let c = 0; c < checked.length; c++) {
                                let rollData = checked[c].value.split(",");
                                rerolls.push({ result: rollData[0], faces: rollData[1], index: rollData[2] }); 
                            } 
                            resolve(rerolls);
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
        let rerolls = await empoweredRerolls;
        if (!rerolls) return;
        if (rerolls.length > Math.max(1, tactor.data.data.abilities.cha.mod)) return ui.notifications.warn(`Too many dice selected (Maximum ${Math.max(1, tactor.data.data.abilities.cha.mod)})`);
	    for (let r = 0; r < rerolls.length; r++) {
            let result = rerolls[r].result;
            let faces = rerolls[r].faces;
            let index = rerolls[r].index;
            let newRoll = new Roll(`1d${faces}`).evaluate({ async: false });
            if (game.dice3d) game.dice3d.showForRoll(newRoll);
            let replaceRoll = workflow.damageRoll.dice[index].results.find(d => d.result == parseInt(result) && d.active);
            if (!replaceRoll) continue;
            replaceRoll.rerolled = true;
            replaceRoll.active = false;
            workflow.damageRoll.dice[index].results.push({ result: parseInt(newRoll.result), active: true });
            let newSubTotal = parseInt(workflow.damageRoll.dice[index].total) + parseInt(newRoll.total) - parseInt(replaceRoll.result);
            workflow.damageRoll.dice[index].total = newSubTotal;
            workflow.damageRoll.dice[index]._total = newSubTotal;
            workflow.damageRoll.dice[index].result = newSubTotal;
            let newTotal = parseInt(workflow.damageRoll.total) + parseInt(newRoll.total) - parseInt(replaceRoll.result);
            workflow.damageRoll.total = newTotal;
            workflow.damageRoll._total = newTotal;
            workflow.damageRoll.result = newTotal;
            
            workflow.damageRollHTML = await workflow.damageRoll.render();
        }
        await usesItem.update({ "data.uses.value": Math.max(0, usesItem.data.data.uses.value - 1) });

    }
} catch (err) {
    console.error("Metamagic macro error", err);
}