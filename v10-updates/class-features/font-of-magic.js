try {
    if (args[0].tag === "OnUse" && args[0].macroPass === "preItemRoll") {
        Hooks.once("dnd5e.preUseItem", (item, config, options) => {
            options.configureDialog = false;
            return true;
        });
        Hooks.once("dnd5e.preItemUsageConsumption", (item, config, options) => {
            config.consumeUsage = false;
            return true;
        });
    } else if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
        let spend = { spell1: 2, spell2: 3, spell3: 5, spell4: 6, spell5: 7 };
        let item = args[0].actor.items.find(i => i.name === "Font of Magic" && i.system.uses);
        let spells = [];
        Object.keys(args[0].actor.system.spells).forEach(key => {
            if (key === "pact" && args[0].actor.system.spells.pact.max > 0) spells.push({type: key, level: args[0].actor.system.spells.pact.level, value: args[0].actor.system.spells.pact.value, max: args[0].actor.system.spells.pact.max});
            if (key !== "pact" && args[0].actor.system.spells[key].max > 0) spells.push({type: key, level: +key.slice(-1), value: args[0].actor.system.spells[key].value, max: args[0].actor.system.spells[key].max});
        });
        let buttonList = {};
        let inputText = ""
        if (spells.find(spell => spell.type !== "pact" && spell.value < spell.max && item.system.uses.value >= spend[spell.type])) buttonList.sorcSlot = {
            icon: '<i class="fas fa-bolt"></i>',
            label: "Spell Slot",
            callback: () => {
                spells.filter(spell => spell.type !== "pact" && spell.value < spell.max && item.system.uses.value >= spend[spell.type]).forEach(spell => inputText += `<div class="form-group"><label for="${spell.type}">Spell Slot Level ${spell.level} [${spell.value}/${spell.max}]</label><input id="${spell.type}" name="spellSlot" value="${spell.level}" type="radio"></div>`);
                new Dialog({
                    title: "Font of Magic",
                    content: `<form><p>Choose a spell slot to create:</p><hr>${inputText}</form>`,
                    buttons: {
                        recover: {
                            icon: '<i class="fas fa-bolt"></i>',
                            label: "Convert",
                            callback: () => {
                                let slot = {type: $('input[name="spellSlot"]:checked').attr('id'), level: +$('input[name="spellSlot"]:checked').val()};
                                let spellUpdate = new Object();
                                spellUpdate[`system.spells.${slot.type}.value`] = args[0].actor.system.spells[slot.type].value + 1;
                                args[0].actor.update(spellUpdate);
                                item.update({"system.uses.value": item.system.uses.value - spend[slot.type]});
                                let roll_results = `<div><i>Converted ${spend[slot.type]} Sorcery Points. Level ${slot.level} spell slot restored.</i></div>`;
                                const chatMessage = game.messages.get(args[0].itemCardId);
                                let content = duplicate(chatMessage.content);
                                const replaceString = `<div class="midi-qol-saves-display"><div class="end-midi-qol-saves-display">${roll_results}`;
                                content = content.replace(/<div class="midi-qol-saves-display">[\s\S]*<div class="end-midi-qol-saves-display">/g, replaceString);
                                chatMessage.update({ content: content });
                            }
                        }
                    }
                }).render(true);
            }
        };
        if (spells.length > 0 && item.system.uses.value !== item.system.uses.max) buttonList.spellSlot = {    
            icon: '<i class="fas fa-brain"></i>',
            label:  "Sorcery Point(s)",
            callback: () => {
                spells.filter(spell => spell.value > 0).forEach(spell => inputText += `<div class="form-group"><label for="${spell.type}">Spell Slot Level ${spell.level} ${spell.type === "pact" ? "(Pact Slot) " : ""}[${spell.value}/${spell.max}]</label><input id="${spell.type}" name="spellSlot" value="${spell.level}" type="radio"></div>`);
                new Dialog({
                    title: "Font of Magic",
                    content: `<form><p>Choose a spell slot to convert:</p><hr>${inputText}</form>`,
                    buttons: {
                        recover: {
                            icon: '<i class="fas fa-brain"></i>',
                            label: "Convert",
                            callback: () => {
                                let slot = {type: $('input[name="spellSlot"]:checked').attr('id'), level: +$('input[name="spellSlot"]:checked').val()};
                                let spellUpdate = new Object();
                                spellUpdate[`system.spells.${slot.type}.value`] = args[0].actor.system.spells[slot.type].value - 1;
                                args[0].actor.update(spellUpdate);
                                item.update({"system.uses.value": item.system.uses.value + slot.level});
                                let roll_results = `<div><i>Converted a Level ${slot.level} spell slot. ${slot.level} Sorcery Points restored.</i></div>`;
                                const chatMessage = game.messages.get(args[0].itemCardId);
                                let content = duplicate(chatMessage.content);
                                const replaceString = `<div class="midi-qol-saves-display"><div class="end-midi-qol-saves-display">${roll_results}`;
                                content = content.replace(/<div class="midi-qol-saves-display">[\s\S]*<div class="end-midi-qol-saves-display">/g, replaceString);
                                chatMessage.update({ content: content });
                            }
                        }
                    }
                }).render(true);
            }
        };
        if (!Object.keys(buttonList).length) return ui.notifications.warn("Invalid number of Spell Slots or Sorcery Points");
        new Dialog({
            title: "Font of Magic",
            content: "Convert to the following:",
            buttons: buttonList
        }).render(true);
    }
} catch (err)  {console.error("Font of Magic Macro - ", err); }