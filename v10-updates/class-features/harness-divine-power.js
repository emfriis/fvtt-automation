try {
    let inputText = "";
    Object.keys(args[0].actor.system.spells).forEach(key => {if (key !== "pact" && +key.slice(-1) <= Math.ceil(args[0].actor.system.attributes.prof/2) && args[0].actor.system.spells[key].max > args[0].actor.system.spells[key].value) inputText += `<div class="form-group"><label for="${key}">Spell Slot Level ${+key.slice(-1)} [${args[0].actor.system.spells[key].value}/${args[0].actor.system.spells[key].max}]</label><input id="${key}" name="spellSlot" value="${+key.slice(-1)}" type="radio"></div>`});
    if (inputText === "") return ui.notifications.warn("No applicable Spell Slots have been expended");
    new Dialog({
        title: "Harness Divine Power",
        content: `<form><p>Choose a spell slot to restore.</p><hr>${inputText}</form>`,
        buttons: {
            restore: {
                icon: '<i class="fas fa-bolt"></i>',
                label: "Restore",
                callback: () => {
                    let slot = {type: $('input[name="spellSlot"]:checked').attr('id'), level: +$('input[name="spellSlot"]:checked').val()};
                    let spellUpdate = new Object();
                    spellUpdate[`system.spells.${slot.type}.value`] = args[0].actor.system.spells[slot.type].value + 1;
                    args[0].actor.update(spellUpdate);
                    let roll_results = `<div><i>Level ${slot.level} spell slot restored.</i></div>`;
                    const chatMessage = game.messages.get(args[0].itemCardId);
                    let content = duplicate(chatMessage.content);
                    const replaceString = `<div class="midi-qol-saves-display"><div class="end-midi-qol-saves-display">${roll_results}`;
                    content = content.replace(/<div class="midi-qol-saves-display">[\s\S]*<div class="end-midi-qol-saves-display">/g, replaceString);
                    chatMessage.update({ content: content });
                }
            }
        }
    }).render(true);
} catch (err)  {console.error("Harness Divine Power Macro - ", err); }