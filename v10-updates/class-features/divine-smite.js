try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postDamageRoll" || !["mwak"].includes(args[0].item.system.actionType) || !args[0].damageRoll) return;
    let inputText = "";
    Object.keys(args[0].actor.system.spells).forEach(key => {
		if (key === "pact" && +args[0].actor.system.spells[key].level <= Math.ceil(args[0].actor.system.attributes.prof / 2) && args[0].actor.system.spells[key].value) inputText += `<div class="form-group"><label for="${key}">Pact Magic: Level ${+args[0].actor.system.spells[key].level} [${args[0].actor.system.spells[key].value}/${args[0].actor.system.spells[key].max}]</label><input id="${key}" name="spellSlot" value="${+args[0].actor.system.spells[key].level}" type="radio"></div>`
		if (key !== "pact" && +key.slice(-1) <= Math.ceil(args[0].actor.system.attributes.prof / 2) && args[0].actor.system.spells[key].value) inputText += `<div class="form-group"><label for="${key}">Spell Slot: Level ${+key.slice(-1)} [${args[0].actor.system.spells[key].value}/${args[0].actor.system.spells[key].max}]</label><input id="${key}" name="spellSlot" value="${+key.slice(-1)}" type="radio"></div>`
	});
    if (inputText === "") return ui.notifications.warn("No Spell Slots available");
    let slot = await new Promise((resolve) => {
        new Dialog({
            title: "Divine Smite",
            content: `
            <form id="spell-use-form">
                <p>Expend a Spell Slot to use Divine Smite?</p>
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
    if (slot.consume) {
        let spellUpdate = new Object();
        spellUpdate[`system.spells.${slot.type}.value`] = Math.max(args[0].actor.system.spells[slot.type].value - 1, 0);
        args[0].actor.update(spellUpdate);
    }
    let typeBonus = ["undead", "fiend"].find(t => args[0].targets[0]?.actor.system.details?.type?.value?.toLowerCase().includes(t)) || ["undead", "fiend"].find(t => args[0].targets[0]?.actor.system.details?.race?.toLowerCase().includes(t));
    let dice = Math.min(+slot.level + 1 + (typeBonus ? 1 : 0), 6);
    let diceMult = args[0].isCritical ? 2: 1;
    let bonusRoll = await new Roll('0 + ' + `${dice * diceMult}d8[radiant]`).evaluate({async: true});
    if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
    for (let i = 1; i < bonusRoll.terms.length; i++) {
        args[0].damageRoll.terms.push(bonusRoll.terms[i]);
    }
    args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${dice * diceMult}d8[radiant]`;
    args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
    await args[0].workflow.setDamageRoll(args[0].damageRoll);
    args[0].workflow.divineSmite = true;
} catch (err)  {console.error("Divine Smite Macro - ", err)}