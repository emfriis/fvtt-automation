try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postDamageRoll") return;
    let options = "";
    Object.keys(args[0].actor.system.spells).forEach(key => {
        if (key === "pact" && args[0].actor.system.spells.pact.value > 0) options += `<option id="${args[0].actor.system.spells.pact.level}" value="${key}">Pact Magic: Level ${game.i18n.format('DND5E.SpellLevelSlot', {level: args[0].actor.system.spells.pact.level, n: args[0].actor.system.spells.pact.value})}</option>`;
        if (key !== "pact" && args[0].actor.system.spells[key].value > 0) options += `<option id="${key.slice(-1)}" value="${key}">Level ${game.i18n.format('DND5E.SpellLevelSlot', {level: +key.slice(-1), n: args[0].actor.system.spells[key].value})}</option>`;
    });
    if (options === "") return;
    let slot = await new Promise((resolve) => {
        new Dialog({
            title: "Song of Defense",
            content: `
            <form id="spell-use-form">
                <p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Song of Defense", type: "feature"}) + `</p>
                <div class="form-group">
                    <label>Spell Slot Level</label>
                    <div class="form-fields">
                        <select id="slot" name="slot-level">` + options + `</select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="checkbox">
                    <input id="consume" type="checkbox" name="consumeCheckbox" checked/>` + game.i18n.localize("DND5E.SpellCastConsume") + `</label>
                </div>
            </form>
            `,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: () => {resolve({ level: $("#slot").find(":selected").attr("id"), type: $("#slot").find(":selected").val(), consume: $("#consume").is(":checked")})}
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
    let newDamageFormula = `${+slot.level * 5}`;
    workflow.damageRoll = await new Roll(newDamageFormula).roll();
    workflow.damageTotal = workflow.damageRoll.total;
    workflow.damageRollHTML = await workflow.damageRoll.render();
} catch (err)  {console.error("Song of Defense Macro - ", err)}