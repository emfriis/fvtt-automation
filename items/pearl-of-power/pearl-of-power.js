// pearl of power
// OnUse macro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

function getSpellSlots(actor, level) {
    return actor.data.data.spells[`spell${level}`];
}

async function spellAdd(actor, slot) {
    let actorData = duplicate(actor.data._source);
    actorData.data.spells[`${slot}`].value = actorData.data.spells[`${slot}`].value + 1;
    await actor.update(actorData);
}

function hasAvailableSlot(actor, max) {
    for (let slot in actor.data.data.spells) {
        if (actor.data.data.spells.pact.level <= max && actor.data.data.spells.pact.value < actor.data.data.spells.pact.max) {
            return true;
        }
        if (parseInt(slot.slice(-1)) <= max && actor.data.data.spells[slot].value < actor.data.data.spells[slot].max) {
            return true;
        }
    }
    return false;
}

let inputText = "";
if (hasAvailableSlot(tactor, 3)) {
    if (tactor.data.data.spells.pact.level <= 3 && tactor.data.data.spells.pact.value < tactor.data.data.spells.pact.max) {
        inputText += `<div class="form-group"><label for="pact">Pact Slot Level ${tactor.data.data.spells.pact.level} [${tactor.data.data.spells.pact.value}/${tactor.data.data.spells.pact.max}]</label><input id="pact" name="spellSlot" value="pact" type="radio"></div>`;
    }
    for (let i = 1; i <= 3; i++) {
        let chosenSpellSlots = getSpellSlots(tactor, i);
        let minSlots = chosenSpellSlots.value;
        let maxSlots = chosenSpellSlots.max;
        if (minSlots != maxSlots) {
            inputText += `<div class="form-group"><label for="spell${i}">Spell Slot Level ${i} [${minSlots}/${maxSlots}]</label><input id="spell${i}" name="spellSlot" value="${i}" type="radio"></div>`;
        }
    }
    new Dialog({
        title: "Pearl of Power",
        content: `<form><p>Choose 1 spell slot to recover</p><hr>${inputText}</form>`,
        buttons: {
            recover: {
                icon: '<i class="fas fa-check"></i>',
                label: "Recover",
                callback: async (html) => {
                    let selected_slot = html.find('input[name="spellSlot"]:checked');
                    let slot = "";
                    let num = "";
                    for (let i = 0; i < selected_slot.length; i++) {
                        slot = selected_slot[i].id;
                        num = selected_slot[i].value;
                    }
                    if (slot === "") return ui.notifications.warn(`The ability fails, no spell slot was selected`);
                    spellAdd(tactor, slot);
                    let roll_results = `<div>Regains 1 spell slot, Level ${num}.</div>`;
                    const chatMessage = game.messages.get(args[0].itemCardId);
                    let content = duplicate(chatMessage.data.content);
                    const searchString = /<div class="midi-qol-saves-display">[\s\S]*<div class="end-midi-qol-saves-display">/g;
                    const replaceString = `<div class="midi-qol-saves-display"><div class="end-midi-qol-saves-display">${roll_results}`;
                    content = content.replace(searchString, replaceString);
                    chatMessage.update({ content: content });
                }
            }
        }
    }).render(true);
} else {
    return ui.notifications.warn(`You aren't missing any spell slots of third level or lower.`);
}