try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "preItemRoll" || args[0].item.system.uses?.value) return;
    let inputText = "";
    Object.keys(args[0].actor.system.spells).forEach(key => {
		if (key === "pact" && +args[0].actor.system.spells[key].level <= Math.ceil(args[0].actor.system.attributes.prof / 2) && args[0].actor.system.spells[key].value) inputText += `<div class="form-group"><label for="${key}">Pact Magic: Level ${+args[0].actor.system.spells[key].level} [${args[0].actor.system.spells[key].value}/${args[0].actor.system.spells[key].max}]</label><input id="${key}" name="spellSlot" value="${+args[0].actor.system.spells[key].level}" type="radio"></div>`
		if (key !== "pact" && +key.slice(-1) <= Math.ceil(args[0].actor.system.attributes.prof / 2) && args[0].actor.system.spells[key].value) inputText += `<div class="form-group"><label for="${key}">Spell Slot: Level ${+key.slice(-1)} [${args[0].actor.system.spells[key].value}/${args[0].actor.system.spells[key].max}]</label><input id="${key}" name="spellSlot" value="${+key.slice(-1)}" type="radio"></div>`
	});
    if (inputText === "") return ui.notifications.warn("No Spell Slots available");
    let slot = await new Promise((resolve) => {
        new Dialog({
            title: "Expend Spell Slot",
            content: `
            <form id="spell-use-form">
                <p>Expend a Spell Slot to use this feature?</p>
                ${inputText}
                <div class="form-group"><label class="checkbox"><input id="consume" type="checkbox" name="consumeCheckbox" checked/>` + game.i18n.localize("DND5E.SpellCastConsume") + `</label></div>
            </form>
            `,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: () => {resolve({ level: +$('input[name="spellSlot"]:checked')?.val(), type: $('input[name="spellSlot"]:checked')?.attr('id'), consume: $("#consume").is(":checked")})}
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => {resolve(false)}
                }
            },
            default: "cancel",
            close: () => {resolve(false)}
        }).render(true);
    });
    if (!slot) return;
	Hooks.once("dnd5e.preUseItem", (item, config, options) => {
		options.configureDialog = false;
		return true;
	});
	Hooks.once("dnd5e.preItemUsageConsumption", (item, config, options) => {
		config.consumeUsage = false;
		return true;
	});
    if (slot.consume) {
        let spellUpdate = new Object();
        spellUpdate[`system.spells.${slot.type}.value`] = Math.max(args[0].actor.system.spells[slot.type].value - 1, 0);
        args[0].actor.update(spellUpdate);
    }
} catch (err)  {console.error("Expend Spell Slot Macro - ", err)}