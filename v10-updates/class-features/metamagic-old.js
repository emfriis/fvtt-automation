try {
    const usesItem = args[0].actor.items.find(i => i.name === "Font of Magic" && i.system.uses.value);
    if (!usesItem || args[0].tag !== "OnUse" || args[0].item.type !== "spell") return;
    if (args[0].macroPass === "preItemRoll" && ["action", "bonus", "reaction", "reactiondamage", "reactionmanual"].includes(args[0].item.system.activation.type)) {
        let metamagicContent = "";
        let carefulItem = args[0].actor.items.find(i => i.name === "Metamagic: Careful Spell");
        if (carefulItem && args[0].item.system.save?.dc && args[0].item.system.save?.ability) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="careful"><img src="${carefulItem.img}" style="border:0px; width: 50px; height:50px;">Careful Spell<br>(1 Sorcery Point)</label>`;
        let distantItem = args[0].actor.items.find(i => i.name === "Metamagic: Distant Spell");
        if (distantItem && (args[0].item.system.range?.value || args[0].item.system.range?.units === "touch")) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="distant"><img src="${distantItem.img}" style="border:0px; width: 50px; height:50px;">Distant Spell<br>(1 Sorcery Point)</label>`;
        let extendedItem = args[0].actor.items.find(i => i.name === "Metamagic: Extended Spell");
        if (extendedItem && args[0].item.system.duration?.value) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="extended"><img src="${extendedItem.img}" style="border:0px; width: 50px; height:50px;">Extended Spell<br>(1 Sorcery Point)</label>`;
        let heightenedItem = args[0].actor.items.find(i => i.name === "Metamagic: Heightened Spell")
        if (heightenedItem && args[0].item.system.save?.dc && args[0].item.system.actionType === "save" && usesItem.system.uses.value >= 3) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="heightened"><img src="${heightenedItem.img}" style="border:0px; width: 50px; height:50px;">Heightened Spell<br>(3 Sorcery Points)</label>`;
        let quickenedItem = args[0].actor.items.find(i => i.name === "Metamagic: Quickened Spell") 
        if (quickenedItem && args[0].item.system.activation.type === "action" && !args[0].actor.effects.find(e => e.label === "Bonus Action")) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="quickened"><img src="${quickenedItem.img}" style="border:0px; width: 50px; height:50px;">Quickened Spell<br>(1 Sorcery Point)</label>`;
        let subtleItem = args[0].actor.items.find(i => i.name === "Metamagic: Subtle Spell");
        if (subtleItem && (args[0].item.system.components?.vocal || args[0].item.system.components?.somatic)) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="subtle"><img src="${subtleItem.img}" style="border:0px; width: 50px; height:50px;">Subtle Spell<br>(1 Sorcery Point)</label>`;
        let transmutedItem = args[0].actor.items.find(i => i.name === "Metamagic: Transmuted Spell");
        if (transmutedItem && args[0].item.system.damage?.parts?.length && args[0].item.system.damage.parts.find(p => ["acid", "cold", "fire", "lightning", "poison", "thunder"].includes(p[1].toLowerCase()))) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="transmuted"><img src="${transmutedItem.img}" style="border:0px; width: 50px; height:50px;">Transmuted Spell<br>(1 Sorcery Point)</label>`;
        let twinnedItem = args[0].actor.items.find(i => i.name === "Metamagic: Twinned Spell");
        if (twinnedItem && ["action", "bonus"].includes(args[0].item.system.activation.type) && ["ally", "creature", "enemy"].includes(args[0].item.system.target.type) && args[0].item.system.target.value === 1 && usesItem.system.uses.value >= Math.max(1, args[0].spellLevel)) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="twinned"><img src="${twinnedItem.img}" style="border:0px; width: 50px; height:50px;">Twinned Spell (${Math.max(1, args[0].spellLevel)}<br>Sorcery Point${Math.max(1, args[0].spellLevel) > 1 ? "s" : ""})</label>`;
        if (metamagicContent === "") return;
        let content = `
            <style>
            .metamagic .form-group {display: flex; flex-wrap: wrap; width: 100%; align-items: flex-start;}
            .metamagic .radio-label { display: flex; flex-direction: column; align-items: center; text-align: center; justify-items: center; flex: 1 0 25%; line-height: normal;}
            .metamagic .radio-label input {display: none;}
            .metamagic img {border: 0px; width: 50px; height: 50px; flex: 0 0 50px; cursor: pointer;}
            .metamagic [type=radio]:checked + img {outline: 2px solid #f00;}
            </style>
            <form class="metamagic">
                <div class="form-group" id="metamagics">${metamagicContent}</div>
                <div><p>(${usesItem.system.uses.value} Sorcery Point${usesItem.system.uses.value > 1 ? "s" : ""} Remaining)</p></div>
            </form>
        `;
        let dialog = new Promise(async (resolve) => {
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
        let metamagic = await dialog;
        if (!metamagic) return;
        if (metamagic === "careful") {
            // careful spell
            let carefulDialog =  new Promise(async (resolve) => {
                new Dialog({
                    title: "Metamagic: Careful Spell",
                    content: `<p>Target any creatures you want to protect.<br>(Up to ${Math.max(1, args[0].actor.system.abilities.cha.mod)} Creatures)</p>`,
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
		    if (targets.length > Math.max(1, args[0].actor.system.abilities.cha.mod)) return ui.notifications.warn(`Too many targets selected for Careful Spell (Maximum ${Math.max(1, args[0].actor.system.abilities.cha.mod)})`);
	        let hook = Hooks.on("midi-qol.postCheckSaves", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    for (let t = 0; t < targets.length; t++) {
                        if (workflowNext.failedSaves.has(targets[t]) && !workflowNext.saves.has(targets[t])) {
                            workflowNext.failedSaves.delete(targets[t]);
                            workflowNext.saves.add(targets[t]);
                            Object.assign(workflowNext.saveDisplayData.find(d => d.target === targets[t]), { saveString: "succeeds", saveStyle: "color: green" });
                        }
                    }
                    Hooks.off("midi-qol.postCheckSaves", hook);
                }
            });
            await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
        } else if (metamagic === "distant") {
            const effectData = {
                changes: [{ key: "flags.midi-qol.distantSpell", mode: 0, value: 1, priority: 20, },],
                disabled: false,
                label: "Metamagic: Distant Spell",
                flags: { dae: { specialDuration: ["turnEnd","turnStart"] } }
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
            await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
        } else if (metamagic === "extended") {  
            // extended spell
            let hook = Hooks.on("midi-qol.RollComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    let effects = workflowNext.actor.effects.filter(e => e.origin === args[0].uuid);   
                    for (let e = 0; e < effects.length; e++) {
                        let effect = effects[e];
                        if (effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, duration: { seconds: (effect.duration.seconds ? effect.duration.seconds * 2 : null), turns: (effect.duration.turns ? effect.duration.turns * 2 : null), rounds: (effect.duration.rounds ? effect.duration.rounds * 2 : null), startTime: effect.duration.startTime, startTurn: effect.duration.startTurn, startRound: effect.duration.startRound } }] });
                    }
                    let targets = Array.from(workflowNext.targets);
                    for (let t = 0; t < targets.length; t++) {
                        let target = targets[t].actor;
                        if (target && target.uuid !== workflowNext.actor.uuid) {
                            let effects = target.effects.filter(e => e.origin === args[0].uuid);
                            for (let e = 0; e < effects.length; e++) {
                                let effect = effects[e];
                                if (effect && !args[0].item.system.components.concentration) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: target.uuid, updates: [{ _id: effect.id, duration: { seconds: (effect.duration.seconds ? effect.duration.seconds * 2 : null), turns: (effect.duration.turns ? effect.duration.turns * 2 : null), rounds: (effect.duration.rounds ? effect.duration.rounds * 2 : null), startTime: effect.duration.startTime, startTurn: effect.duration.startTurn, startRound: effect.duration.startRound } }] });
                            }
                        }
                    }
                    Hooks.off("midi-qol.RollComplete", hook);
                }
            });
            await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
        } else if (metamagic === "heightened") {
            // heightened spell
            let targets;
            if (args[0].targets.length === 1) {
                targets = [args[0].targets[0]];
            } else {
                let heightenedDialog =  new Promise(async (resolve) => {
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
                targets = await heightenedDialog;
            }
            if (!targets || targets.length !== 1) return ui.notifications.warn("Invalid number of targets selected");
            const effectData = {
                changes: [{ key: "flags.midi-qol.disadvantage.ability.save.all", mode: 0, value: "1", priority: 20 }],
                disabled: false,
                flags: { dae: { specialDuration: ["isSave"] } },
                label: "Metamagic: Heightened Spell",
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targets[0].actor.uuid, effects: [effectData] });
            let hook = Hooks.on("midi-qol.RollComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: targets[0].actor.uuid, effects: [targets[0].actor.effects.find(e => e.label === "Metamagic: Heightened Spell").id] });
                    Hooks.off("midi-qol.RollComplete", hook);
                }
            });
            await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 3) });
	    } else if (metamagic === "quickened") {
            // quickened spell
            if (game.combat) await game.dfreds.effectInterface.addEffect({ effectName: "Bonus Action", uuid: args[0].actor.uuid });
            await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
        } else if (metamagic === "transmuted") {
            // transmuted spell
            let options = ["Acid", "Cold", "Fire", "Lightning", "Poison", "Thunder"];
            const optionContent = options.map((o) => { return `<option value="${o}">${o}</option>` })
            const content = `
            <div class="form-group">
                <label>Damage Types: </label>
                <select name="types"}>${optionContent}</select>
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
            args[0].workflow.newDefaultDamageType = type;
            let hook1 = Hooks.on("midi-qol.preDamageRollComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    workflowNext.defaultDamageType = type;
                    workflowNext.damageRoll.dice.forEach((d) => { 
                        if (options.includes(d.flavor)) {
                            d.flavor = type;
                            d.options.flavor = type;
                            d.formula.replace(d.options.flavor, type);
                        }
                    });
                    workflowNext.damageRollHTML = await workflowNext.damageRoll.render();
                    Hooks.off("midi-qol.preDamageRollComplete", hook1);
                }
            });
            let hook2 = Hooks.on("midi-qol.RollComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    Hooks.off("midi-qol.preDamageRollComplete", hook1);
                    Hooks.off("midi-qol.RollComplete", hook2);
                }
            });
            await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
        } else if (metamagic === "subtle") {
            // subtle spell
            await usesItem.update({ "system.uses.value": usesItem.system.uses.value - 1 });
	    } else if (metamagic === "twinned") {
            // twinned spell
            await usesItem.update({ "system.uses.value": Math.max(1, usesItem.system.uses.value - args[0].spellLevel) });
        }
    } else if (args[0].macroPass === "preAttackRoll" && ["msak","rsak"].includes(args[0].item.system.actionType)) {        
        // seeking spell
        if (!args[0].actor.items.find(i => i.name === "Metamagic: Seeking Spell") || usesItem.system.uses.value < 2) return;
        const effectData = {
            changes: [
                { key: "flags.midi-qol.optional.ss.count", mode: 5, value: "ItemUses.Sorcery Points", priority: 20, },
                { key: "flags.midi-qol.optional.ss.countAlt", mode: 5, value: "ItemUses.Sorcery Points", priority: 20, },
                { key: "flags.midi-qol.optional.ss.label", mode: 5, value: "Metamagic: Seeking Spell", priority: 20, },
                { key: "flags.midi-qol.optional.ss.attack.fail.all", mode: 5, value: "reroll", priority: 20, },
            ],
            disabled: false,
            flags: { dae: { specialDuration: ["1Attack", "1Spell"] } },
            icon: "icons/magic/light/projectile-flare-blue.webp",
            label: "Metamagic: Seeking Spell",
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });   
    } else if (args[0].macroPass === "postDamageRoll" && args[0].hitTargets.length) {
        // empowered spell
        if (!(args[0].actor.items.find(i => i.name === "Metamagic: Empowered Spell") && args[0].item.system.damage?.parts?.length && !["healing", "temphp"].includes(args[0].item.system.damage.parts[0][1]))) return;
        let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
        let dice = workflow.damageRoll.dice;
        let die_content = "";
        for (let d = 0; d < dice.length; d++) {
            let results = dice[d].results;
            for (let r = 0; r < results.length; r++) {
                if (results[r]?.rerolled) continue;
                die_content += `<label class='checkbox-label' for='die${d}${r}'>
                    <input type='checkbox' id='die${d}${r}' name='die' value='${results[r].result},${dice[d].faces},${d}'/>
                    <div style="border:0px; width: 50px; height:50px;">
                        <img src="icons/svg/d${workflow.damageRoll.dice[d].faces}-grey.svg" style="position: relative;">
                        <p style="position: relative; bottom: 55px; font-weight: bolder; font-size: 25px">${results[r].result}</p>
                    </div>
                    <p>(${dice[d].flavor})</p>
                </label>
                `;
            }
        }
        let content = `
        <style>
        .dice .form-group { display: flex; flex-wrap: wrap; width: 100%; align-items: flex-start; }
        .dice .checkbox-label { display: flex; flex-direction: column; align-items: center; text-align: center; justify-items: center; flex: 1 0 25%; line-height: normal; }
        .dice .check-label input { display: none; }
        .dice img { border: 0px; width: 50px; height: 50px; flex: 0 0 50px; cursor: pointer; }
        </style>
        <form class="dice">
            <div><p>Choose up to ${Math.max(1, args[0].actor.system.abilities.cha.mod)} damage dice to reroll:</p></div>
            <div class="form-group" id="dice-group">${die_content}</div>
            <div><p>(${usesItem.system.uses.value} Sorcery Points Remaining)</p></div>
        </form>
        `;
        let empoweredRerolls = await new Promise((resolve) => {
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
        if (rerolls.length > Math.max(1, args[0].actor.system.abilities.cha.mod)) return ui.notifications.warn(`Too many dice selected (Maximum ${Math.max(1, args[0].actor.system.abilities.cha.mod)})`);
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
        await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
    }
} catch (err) {console.error("Metamagic Macro - ", err);}

// -------------------------------------------------------

try {
    if (args[0].item.type != "spell") return;
    const usesItem = args[0].actor.items.find(i => i.name == "Font of Magic" && i.system.uses.value);
    let consume = true;
    if (args[0].macroPass == "preTargeting" && usesItem.system.uses.value && ["action", "bonus", "reaction", "reactiondamage", "reactionmanual"].includes(args[0].item.system.activation.type) && !args[0].workflow.metamagic) {
        let metamagicContent = "";
        let carefulItem = args[0].actor.items.find(i => i.name == "Metamagic: Careful Spell");
        if (carefulItem && args[0].item.system.save?.dc && args[0].item.system.save?.ability) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="careful"><img src="${carefulItem.img}" style="border:0px; width: 50px; height:50px;">Careful Spell<br>(1 Sorcery Point)</label>`;
        let distantItem = args[0].actor.items.find(i => i.name == "Metamagic: Distant Spell");
        if (distantItem && (args[0].item.system.range?.value || args[0].item.system.range?.units == "touch")) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="distant"><img src="${distantItem.img}" style="border:0px; width: 50px; height:50px;">Distant Spell<br>(1 Sorcery Point)</label>`;
        let extendedItem = args[0].actor.items.find(i => i.name == "Metamagic: Extended Spell");
        if (extendedItem && args[0].item.system.duration?.value) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="extended"><img src="${extendedItem.img}" style="border:0px; width: 50px; height:50px;">Extended Spell<br>(1 Sorcery Point)</label>`;
        let heightenedItem = args[0].actor.items.find(i => i.name == "Metamagic: Heightened Spell")
        if (heightenedItem && args[0].item.system.save?.dc && args[0].item.system.actionType == "save" && usesItem.system.uses.value >= 3) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="heightened"><img src="${heightenedItem.img}" style="border:0px; width: 50px; height:50px;">Heightened Spell<br>(3 Sorcery Points)</label>`;
        let quickenedItem = args[0].actor.items.find(i => i.name == "Metamagic: Quickened Spell") 
        if (quickenedItem && args[0].item.system.activation.type == "action" && !args[0].actor.effects.find(e => e.label == "Bonus Action")) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="quickened"><img src="${quickenedItem.img}" style="border:0px; width: 50px; height:50px;">Quickened Spell<br>(1 Sorcery Point)</label>`;
        let subtleItem = args[0].actor.items.find(i => i.name == "Metamagic: Subtle Spell");
        if (subtleItem && (args[0].item.system.components?.vocal || args[0].item.system.components?.somatic)) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="subtle"><img src="${subtleItem.img}" style="border:0px; width: 50px; height:50px;">Subtle Spell<br>(1 Sorcery Point)</label>`;
        let transmutedItem = args[0].actor.items.find(i => i.name == "Metamagic: Transmuted Spell");
        if (transmutedItem && args[0].item.system.damage?.parts?.length && args[0].item.system.damage.parts.find(p => ["acid", "cold", "fire", "lightning", "poison", "thunder"].includes(p[1].toLowerCase()))) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="transmuted"><img src="${transmutedItem.img}" style="border:0px; width: 50px; height:50px;">Transmuted Spell<br>(1 Sorcery Point)</label>`;
        let twinnedItem = args[0].actor.items.find(i => i.name == "Metamagic: Twinned Spell");
        if (twinnedItem && ["action", "bonus"].includes(args[0].item.system.activation.type) && ["ally", "creature", "enemy"].includes(args[0].item.system.target.type) && args[0].item.system.target.value == 1 && usesItem.system.uses.value >= Math.max(1, args[0].spellLevel)) metamagicContent += `<label class="radio-label"><br><input type="radio" name="metamagic" value="twinned"><img src="${twinnedItem.img}" style="border:0px; width: 50px; height:50px;">Twinned Spell (${Math.max(1, args[0].spellLevel)}<br>Sorcery Point${Math.max(1, args[0].spellLevel) > 1 ? "s" : ""})</label>`;
        if (metamagicContent == "") return;
        let content = `
            <style>
            .metamagic .form-group {display: flex; flex-wrap: wrap; width: 100%; align-items: flex-start;}
            .metamagic .radio-label { display: flex; flex-direction: column; align-items: center; text-align: center; justify-items: center; flex: 1 0 25%; line-height: normal;}
            .metamagic .radio-label input {display: none;}
            .metamagic img {border: 0px; width: 50px; height: 50px; flex: 0 0 50px; cursor: pointer;}
            .metamagic [type=radio]:checked + img {outline: 2px solid #f00;}
            </style>
            <form class="metamagic">
                <div class="form-group" id="metamagics">${metamagicContent}</div>
                <div><p>(${usesItem.system.uses.value} Sorcery Point${usesItem.system.uses.value > 1 ? "s" : ""} Remaining)</p></div>
                <div class="form-group">
                    <label class="checkbox">
                    <input id="consume" type="checkbox" name="consumeCheckbox" checked/><b>Consume Sorcery Point(s)?</b></label>
                </div>
            </form>
        `;
        let dialog = new Promise(async (resolve) => {
            new Dialog({
                title: "Metamagic: Usage Configuration",
                content,
                buttons: {
                    Confirm: {
                        label: "Confirm",
                        callback: async () => {
                            let metamagic = $("input[type='radio'][name='metamagic']:checked").val();
                            consume = $("#consume").is(":checked");
                            resolve(metamagic);
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
        let metamagic = await dialog;
        if (!metamagic) {
            args[0].workflow.metamagic = "none";
            return;
        }
        if (metamagic == "quickened") {
            // quickened spell
            if (game.combat) await game.dfreds.effectInterface.addEffect({ effectName: "Bonus Action", uuid: args[0].actor.uuid });
            if (consume) await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
            args[0].workflow.metamagic = "quickened";
        } else if (metamagic == "subtle") {
            // subtle spell
            if (consume) await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
            args[0].workflow.metamagic = "subtle";
        } else if (metamagic == "twinned") {
            // twinned spell
            if (consume) await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - Math.max(1, args[0].spellLevel)) });
            args[0].workflow.metamagic = "twinned";
        } else if (metamagic == "careful") {
            // careful spell
            let carefulDialog =  new Promise(async (resolve) => {
                new Dialog({
                    title: "Metamagic: Careful Spell",
                    content: `<p>Target any creatures you want to protect.<br>(Up to ${Math.max(1, args[0].actor.system.abilities.cha.mod)} Creatures)</p>`,
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
            let targets = await carefulDialog;
            if (!targets) return;
            if (targets.length > Math.max(1, args[0].actor.system.abilities.cha.mod)) return ui.notifications.warn(`Too many targets selected for Careful Spell (Maximum ${Math.max(1, args[0].actor.system.abilities.cha.mod)})`);
            let hook1 = Hooks.on("midi-qol.postCheckSaves", async workflowNext => {
                if (workflowNext.uuid == args[0].uuid) {
                    for (let t = 0; t < targets.length; t++) {
                        if (workflowNext.failedSaves.has(targets[t]) && !workflowNext.saves.has(targets[t])) {
                            workflowNext.failedSaves.delete(targets[t]);
                            workflowNext.saves.add(targets[t]);
                            Object.assign(workflowNext.saveDisplayData.find(d => d.target == targets[t]), { saveString: "succeeds", saveStyle: "color: green" });
                        }
                    }
                    Hooks.off("midi-qol.postCheckSaves", hook1);
                    Hooks.off("midi-qol.preItemRoll", hook2);
                }
            });
            let hook2 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
                if (workflowNext.uuid == args[0].uuid) {
                    Hooks.off("midi-qol.postCheckSaves", hook1);
                    Hooks.off("midi-qol.preItemRoll", hook2);
                }
            });
            if (consume) await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
            args[0].workflow.metamagic = "careful";
        } else if (metamagic == "distant") {
            // distant spell
            const effectData = {
                changes: [{ key: `flags.midi-qol.range.${args[0].item.system.actionType}`, mode: 2, value: `${args[0].item.system.range.units == "touch" ? 25 : args[0].item.system.range.value}`, priority: 20 }],
                disabled: false,
                name: "Distant Spell",
                icon: "icons/skills/targeting/target-strike-triple-blue.webp",
                duration: { seconds: 1 },
                flags: { dae: { specialDuration: ["endCombat", "1Spell"] } }
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
            if (consume) await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
            args[0].workflow.metamagic = "distant";
        } else if (metamagic == "extended") {  
            // extended spell
            let hook1 = Hooks.on("midi-qol.RollComplete", async workflowNext => {
                if (workflowNext.uuid == args[0].uuid) {
                    let effects = workflowNext.actor.effects.filter(e => e.origin == args[0].uuid);   
                    for (let e = 0; e < effects.length; e++) {
                        let effect = effects[e];
                        if (effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, duration: { seconds: (effect.duration.seconds ? effect.duration.seconds * 2 : null), turns: (effect.duration.turns ? effect.duration.turns * 2 : null), rounds: (effect.duration.rounds ? effect.duration.rounds * 2 : null), startTime: effect.duration.startTime, startTurn: effect.duration.startTurn, startRound: effect.duration.startRound } }] });
                    }
                    let targets = Array.from(workflowNext.targets);
                    for (let t = 0; t < targets.length; t++) {
                        let target = targets[t].actor;
                        if (target && target.uuid != workflowNext.actor.uuid) {
                            let effects = target.effects.filter(e => e.origin == args[0].uuid);
                            for (let e = 0; e < effects.length; e++) {
                                let effect = effects[e];
                                if (effect && !args[0].item.system.components.concentration) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: target.uuid, updates: [{ _id: effect.id, duration: { seconds: (effect.duration.seconds ? effect.duration.seconds * 2 : null), turns: (effect.duration.turns ? effect.duration.turns * 2 : null), rounds: (effect.duration.rounds ? effect.duration.rounds * 2 : null), startTime: effect.duration.startTime, startTurn: effect.duration.startTurn, startRound: effect.duration.startRound } }] });
                            }
                        }
                    }
                }
            });
            let hook2 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
                if (workflowNext.uuid == args[0].uuid && workflowNext.metamagic != "extended") {
                    Hooks.off("midi-qol.RollComplete", hook1);
                    Hooks.off("midi-qol.preItemRoll", hook2);
                }
            });
            if (consume) await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
            args[0].workflow.metamagic = "extended";
        } else if (metamagic == "heightened") {
            // heightened spell
            let heightenedDialog =  new Promise(async (resolve) => {
                new Dialog({
                    title: "Metamagic: Heightened Spell",
                    content: `<p>Target a creature to weaken.</p>`,
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
            let targets = await heightenedDialog;
            if (!targets || targets.length != 1) return ui.notifications.warn("Invalid number of targets selected");
            const effectData = {
                changes: [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Metamagic, preTargetSave", priority: 20 }, { key: "flags.midi-qol.heightenedSpell", mode: 2, value: args[0].uuid, priority: 20 }],
                disabled: false,
                name: "Heightened Spell Save Disadvantage",
                icon: heightenedItem.img
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targets[0].actor.uuid, effects: [effectData] });
            if (consume) await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 3) });
            args[0].workflow.metamagic = "heightened";
        } else if (metamagic == "transmuted") {
            // transmuted spell
            let options = ["Acid", "Cold", "Fire", "Lightning", "Poison", "Thunder"];
            const optionContent = options.map((o) => { return `<option value="${o}">${o}</option>` });
            const content = `
            <div class="form-group">
                <label>Damage Types: </label>
                <select name="types"}>${optionContent}</select>
            </div>
            `;
            let transmutedDialog =  new Promise(async (resolve) => {
                new Dialog({
                    title: "Metamagic: Transmuted Spell",
                    content,
                    buttons: {
                        Confirm: {
                            label: "Confirm",
                            callback: () => {resolve($("[name=types]")[0].value)},
                        },
                    },
                    default: "Confirm",
                    close: () => { resolve(false) },
                }).render(true);
            });
            let type = await transmutedDialog;
            if (!type) return;
            args[0].workflow.newDefaultDamageType = type;
            let hook1 = Hooks.on("midi-qol.preDamageRollComplete", async workflowNext => {
                if (workflowNext.uuid == args[0].uuid && workflowNext.newDefaultDamageType) {
                    workflowNext.defaultDamageType = workflowNext.newDefaultDamageType;
                    let newDamageRoll = workflowNext.damageRoll;
                    newDamageRoll.terms.forEach(t => { 
                        if (options.includes(t.options.flavor)) {
                            t.options.flavor = type;
                            t.formula.replace(t.options.flavor, type);
                        }
                    });
                    await args[0].workflow.setDamageRoll(newDamageRoll);
                }
            });
            let hook2 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
                if (workflowNext.uuid == args[0].uuid && workflowNext.metamagic != "transmuted") {
                    Hooks.off("midi-qol.preDamageRollComplete", hook1);
                    Hooks.off("midi-qol.preItemRoll", hook2);
                }
            });
            if (consume) await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
            args[0].workflow.metamagic = "transmuted";
        }
    } else if (args[0].macroPass == "preTargeting" && args[0].workflow.metamagic == "distant") {
        const effectData = {
            changes: [{ key: `flags.midi-qol.range.${args[0].item.system.actionType}`, mode: 2, value: `${args[0].item.system.range.units == "touch" ? 25 : args[0].item.system.range.value}`, priority: 20 }],
            disabled: false,
            name: "Distant Spell",
            icon: "icons/skills/targeting/target-strike-triple-blue.webp",
            duration: { seconds: 1 },
            flags: { dae: { specialDuration: ["endCombat", "1Spell"] } }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    } else if (args[0].macroPass == "preCheckHits" && args[0].actor.items.find(i => i.name == "Metamagic: Seeking Spell") && usesItem.system.uses.value > 1 && ["msak","rsak"].includes(args[0].item.system.actionType) && args[0].attackRoll && args[0].targets[0].actor.system.attributes.ac.value > args[0].attackRoll.total) {        
        // seeking spell
        let seekingDialog = await new Promise((resolve) => {
            new Dialog({
                title: "Metamagic: Seeking Spell",
                content: `
                <div>
                    <p>Spend 2 Sorcery Points to reroll the attack roll?</p>
                    <p>(${usesItem.system.uses.value} Sorcery Point${usesItem.system.uses.value > 1 ? "s" : ""} Remaining)</p>
                </div>
                <div class="form-group">
                    <label class="checkbox">
                    <input id="consume" type="checkbox" name="consumeCheckbox" checked/><b>Consume Sorcery Point(s)?</b></label>
                </div>
                `,
                buttons: {
                    Confirm: {
                        label: "Confirm",
                        callback: async () => {
                            consume = $("#consume").is(":checked");
                            resolve(true)
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
        let useReroll = await seekingDialog;
        if (!useReroll) return;
        let reroll = await new Roll("1d20").evaluate({async: true});
        if (game.dice3d) game.dice3d.showForRoll(reroll);
        let highRoll = args[0].attackRoll.terms[0].results.reduce((prev, current) => prev && !prev.rerolled && prev.result > current.result ? prev : current);
        let lowRoll = args[0].attackRoll.terms[0].results.reduce((prev, current) => prev && !prev.rerolled && prev.result < current.result ? prev : current);
        if ((!args[0].attackRoll.hasAdvantage && !args[0].attackRoll.hasDisadvantage) || (args[0].attackRoll.hasAdvantage && args[0].attackRoll.hasDisadvantage) || (args[0].attackRoll.hasAdvantage && reroll.total > highRoll.result)) { // normal roll or attack has advantage and reroll is higher than the previous high roll
            Object.assign(highRoll, { discarded: true, rerolled: false, active: false }); // discard previous high roll
            Object.assign(lowRoll, { discarded: false, rerolled: true, active: false }); // remove previous low roll
            args[0].attackRoll.terms[0].results.push({ result: reroll.total, discarded: false, rerolled: false, active: true, hidden: true }); // assign reroll as new high roll
        } else if (args[0].attackRoll.hasDisadvantage && reroll.total > highRoll.result) { // attack has disadvantage and reroll is higher than previous high roll
            Object.assign(highRoll, { discarded: false, rerolled: false, active: true }); // assign previous high roll as new low roll
            Object.assign(lowRoll, { discarded: false, rerolled: true, active: false }); // remove previous low roll
            args[0].attackRoll.terms[0].results.push({ result: reroll.total, discarded: true, rerolled: false, active: false, hidden: true }); // assign reroll as new high roll
        } else if (args[0].attackRoll.hasDisadvantage && reroll.total < highRoll.result ) { // attack has disadvantage and reroll is lower than previous high roll
            Object.assign(lowRoll, { discarded: false, rerolled: true, active: false });  // remove previous low roll
            args[0].attackRoll.terms[0].results.push({ result: reroll.total, discarded: false, rerolled: false, active: true, hidden: true }); // assign reroll as new low roll
        } else { // attack has advantage and reroll is lower than previous high roll
            Object.assign(lowRoll, { discarded: false, rerolled: true, active: false }); // remove previous low roll
            args[0].attackRoll.terms[0].results.push({ result: reroll.total, disacrded: true, rerolled: false, active: false, hidden: true }); // assign reroll as new low roll
        }
        args[0].attackRoll._total = args[0].attackRoll._evaluateTotal();
        await args[0].workflow.setAttackRoll(args[0].attackRoll);
        if (consume) await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 2) });
    } else if (args[0].tag == "DamageBonus" && (args[0].hitTargets.length || MidiQOL.configSettings().autoRollDamage != "always") && args[0].actor.items.find(i => i.name == "Metamagic: Empowered Spell") && usesItem.system.uses.value && args[0].item.system.damage?.parts?.length && !["healing", "temphp", "", "midi-none"].includes(args[0].item.system.damage.parts[0][1]) && args[0].damageRoll) {
        // empowered spell
        let terms = args[0].damageRoll.terms;
        let termsContent = "";
        for (let t = 0; t < terms.length; t++) {
            if (!terms[t].faces) continue;
            let results = terms[t].results;
            for (let r = 0; r < results.length; r++) {
                if (results[r].rerolled || !results[r].active) continue;
                termsContent += `<label class='checkbox-label' for='die${t}${r}'>
                    <input type='checkbox' id='die${t}${r}' name='die' value='${results[r].result},${terms[t].faces},${t}'/>
                    <tiv style="border:0px; witth: 50px; height:50px;">
                        <img src="icons/svg/d${terms[t].faces}-grey.svg" style="position: relative;">
                        <p style="position: relative; bottom: 55px; font-weight: bolder; font-size: 25px">${results[r].result}</p>
                    </tiv>
                    <p>(${terms[t].flavor ? terms[t].flavor.charAt(0).toUpperCase() + terms[t].flavor.toLowerCase().slice(1) : args[0].workflow.defaultDamageType.charAt(0).toUpperCase() + args[0].workflow.defaultDamageType.toLowerCase().slice(1)})</p>
                </label>
                `;
            }
        }
        let content = `
        <style>
        .dice .form-group { display: flex; flex-wrap: wrap; width: 100%; align-items: flex-start; }
        .dice .checkbox-label { display: flex; flex-direction: column; align-items: center; text-align: center; justify-items: center; flex: 1 0 25%; line-height: normal; }
        .dice .check-label input { display: none; }
        .dice img { border: 0px; width: 50px; height: 50px; flex: 0 0 50px; cursor: pointer; }
        </style>
        <form class="dice">
            <div><p>Choose up to ${Math.max(1, args[0].actor.system.abilities.cha.mod)} damage dice to reroll:</p></div>
            <div class="form-group" id="dice-group">${termsContent}</div>
            <div><p>(${usesItem.system.uses.value} Sorcery Points Remaining)</p></div>
        </form>
        <div class="form-group">
            <label class="checkbox">
            <input id="consume" type="checkbox" name="consumeCheckbox" checked/><b>Consume Sorcery Point(s)?</b></label>
        </div>
        <script>
            var limit = ${Math.max(1, args[0].actor.system.abilities.cha.mod)};
            $("input[type='checkbox'][name='die']").change(function() {
                var bol = $("input[type='checkbox'][name='die']:checked").length >= limit;
                $("input[type='checkbox'][name='die']").not(":checked").attr("disabled", bol);
            });
        </script>
        `;
        let empoweredDialog = await new Promise((resolve) => {
            new Dialog({
                title: "Metamagic: Empowered Spell",
                content,
                buttons: {
                    Confirm: {
                        label: "Confirm",
                        icon: '<i class="fas fa-check"></i>',
                        callback: async () => {
                            let rerolls = [];
                            let checked = $("input[type='checkbox'][name='die']:checked"); 
                            for (let c = 0; c < checked.length; c++) {
                                let rollData = checked[c].value.split(",");
                                rerolls.push({ result: rollData[0], faces: rollData[1], index: rollData[2] }); 
                            } 
                            consume = $("#consume").is(":checked");
                            resolve(rerolls);
                        },
                    },
                    Cancel: {
                        label: "Cancel",
                        icon: '<i class="fas fa-times"></i>',
                        callback: async () => {resolve(false)},
                    },
                },
                default: "Cancel",
                close: () => {resolve(false)}
            }).render(true);
        });
        let rerolls = await empoweredDialog;
        if (!rerolls.length) return;
        newDamageRoll = args[0].workflow.damageRoll;
        rerolls.forEach(async r => {
            let newRoll = new Roll(`1d${r.faces}`).evaluate({ async: false });
            if (game.dice3d) game.dice3d.showForRoll(newRoll);
            let replaceRoll = newDamageRoll.terms[r.index].results.find(d => d.result == parseInt(r.result) && d.active);
            if (replaceRoll) {
                Object.assign(replaceRoll, { rerolled: true, active: false });
                newDamageRoll.terms[r.index].results.push({ result: parseInt(newRoll.result), active: true, hidden: true });
                newDamageRoll._total = newDamageRoll._evaluateTotal();
            }
        });
        await args[0].workflow.setDamageRoll(newDamageRoll);
        if (consume) await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
    } else if (args[0].tag == "TargetOnUse" && args[0].macroPass == "preTargetSave" && args[0].workflow.saveDetails && args[0].options.actor.flags["midi-qol"]?.heightenedSpell?.includes(args[0].uuid)) {
        args[0].workflow.saveDetails.disadvantage = true;
        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].options.actor.uuid, effects: [args[0].options.actor.effects.find(e => e.name == "Heightened Spell Save Disadvantage").id] });
    }
} catch (err) {console.error("Metamagic Macro - ", err);}

// -----------------------------------------------------------------

