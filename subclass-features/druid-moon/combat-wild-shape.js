// combat wild shape
// on use post damage roll

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

function getSpellSlots(actor, level, isPact) {
    if (isPact == false) {
        return actor.data.data.spells[`spell${level}`];
    } else {
        return actor.data.data.spells.pact;
    }
}

if (!tactor.isPolymorphed && !tactor.effects.find(e => e.data.label === "Wild Shape")) return ui.notifications.warn("You are not in Wild Shape");

if (args[0].tag === "OnUse" && lastArg.macroPass === "postDamageRoll") {
    // Get options for available slots
    let optionsText = "";
    for (let i = 1; i < 9; i++) {
        const slots = getSpellSlots(actor, i, false);
        if (slots.value > 0) {
            const level = CONFIG.DND5E.spellLevels[i];
            const label = game.i18n.format('DND5E.SpellLevelSlot', {level: level, n: slots.value});
            optionsText += `<option value="${i}">${label}</option>`;
        }
    }  
    // Check for Pact slots
    const slots = getSpellSlots(actor, 0, true);
    if (slots.value > 0) {
        const level = CONFIG.DND5E.spellLevels[slots.level];
        const label = game.i18n.format('DND5E.SpellLevelSlot', {level: level, n: slots.value}) + ' (Pact)';
        optionsText += `<option value="${i}">${label}</option>`;
    }

    if (optionsText != "") {
        let dialog = new Promise((resolve, reject) => {
            new Dialog({
            title: "Combat Wild Shape: Usage Configuration",
            content: `
                <form id="smite-use-form">
                    <p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Combat Wild Shape", type: "feature"}) + `</p>
                    <div class="form-group">
                        <label>Spell Slot Level</label>
                    <div class="form-fields">
                        <select id="slot" name="slot-level">` + optionsText + `</select>
                    </div>
                    </div>
                        <div class="form-group">
                        <label class="checkbox">
                        <input id="consume" type="checkbox" name="consumeCheckbox" checked/>` + game.i18n.localize("DND5E.SpellCastConsume") + `</label>
                    </div>
                </form>
            `,
            buttons: {
                one: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Heal",
                    callback: () => resolve([parseInt(Array.from((document.getElementById("slot")).options[(document.getElementById("slot")).selectedIndex].text)[0]), $('#consume').is(":checked"), ((document.getElementById("slot")).options[(document.getElementById("slot")).selectedIndex].text)])
                },
                two: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => {resolve(false)}
                }
            },
            default: "two",
            close: () => {resolve(false)}
        }).render(true);
        });
        heal = await dialog;

        let slotLevel = heal[0];
        let consumeSlot = heal[1];
        let pactSlot = (heal[2].slice(heal[2].length - 6) == "(Pact)") ? true : false;
        let chosenSpellSlots = getSpellSlots(actor, slotLevel, pactSlot);
        if (chosenSpellSlots.value < 1 && consumeSlot) {
            ui.notifications.warn("Combat Wild Shape: No Slots of Selected Level Remaining");
            return {};
        }
        if (consumeSlot) {
            let objUpdate = new Object();
            if (!pactSlot) {
                objUpdate['data.spells.spell' + slotLevel + '.value'] = chosenSpellSlots.value - 1;
            } else {
                objUpdate['data.spells.pact.value'] = chosenSpellSlots.value - 1;
            }
            tactor.update(objUpdate);
        }

        let workflow = MidiQOL.Workflow.getWorkflow(lastArg.uuid); 
        let newDamageFormula = `${slotLevel}d6[healing]`;
        workflow.damageRoll = await new Roll(newDamageFormula).roll();
        workflow.damageTotal = workflow.damageRoll.total;
        workflow.damageRollHTML = await workflow.damageRoll.render();
    }
}