try {
    let options = "";
    Object.keys(args[0].actor.system.spells).forEach(key => {
        if (key === "pact" && args[0].actor.system.spells[key].level <= 3 && args[0].actor.system.spells[key].max > 0 && args[0].actor.system.spells[key].value < args[0].actor.system.spells[key].max) options += `<option id="${args[0].actor.system.spells.pact.level}" value="${key}">Pact Magic [Level ${args[0].actor.system.spells.pact.level}] (${args[0].actor.system.spells[key].value}/${args[0].actor.system.spells[key].max} Slots)</option>`;
        if (key !== "pact" && +key.slice(-1) <= 3 && args[0].actor.system.spells[key].max > 0 && args[0].actor.system.spells[key].value < args[0].actor.system.spells[key].max) options += `<option id="${key.slice(-1)}" value="${key}">Level ${key.slice(-1)} (${args[0].actor.system.spells[key].value}/${args[0].actor.system.spells[key].max} Slots)</option>`;
    });
	if (options === "") return ui.notifications.warn("No applicable Spell Slots have been expended");
    new Dialog({
        title: "Restore a Spell Slot",
        content: `
        <form>
            <p>Choose a Spell Slot to restore:</p>
            <div class="form-group">
                <label><b>Spell Slot Level</b></label>
                <div class="form-fields">
                    <select id="slot" name="slot-level">` + options + `</select>
                </div>
            </div>
        </form>
        `,
        buttons: {
            restore: {
                icon: '<i class="fas fa-bolt"></i>',
                label: "Restore",
                callback: () => {
                    let slot = { type: $("#slot").find(":selected").val(), level: +$("#slot").find(":selected").attr("id") };
                    if (!slot.type || !slot.level) return ui.notifications.warn("No Spell Slot was selected");
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
} catch (err)  {console.error("Restore Spell 3 Macro - ", err)}