// font of magic
// on use

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const item = tactor.items.find(i => i.name === "Sorcery Points");
if (!item || !item.data.data.uses.max) return;

let inputText = "";
const resourceConversion = { spell1: 2, spell2: 3, spell3: 5, spell4: 6, spell5: 7 };
const sorcSpend = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 };

// Checking for totals
const keys = Object.keys(tactor.data.data.spells);
const spellTotal = keys.reduce((acc, values, i) => {
    let x = 0;
    if ((i >= 0 && i < 6) && (values != ("pact"))) {
        x = parseInt(Object.values(tactor.data.data.spells)[i].value || 0);
    }
    return acc + x;
}, 0);

const spellTotalMax = keys.reduce((acc, values, i) => {
    let spellMax = values;
    if (spellMax != "spell0" && spellMax != "pact") {
        acc.push(Object.values(tactor.data.data.spells)[i].max);
    }
    return acc;
}, []);

let buttonList = {};
let spellslot = "spellslot";
let sorcslot = "sorcslot";

if ((item.data.data.uses.value === 0) && (spellTotal === 0)) return ui.notifications.error(`You do not have enough Spells Slots or Sorcery Points to do anything`);

if (item.data.data.uses.value > 1) buttonList[sorcslot] = {
    icon: '<i class="fas fa-bolt"></i>',
    label: "Spell Slot",
    callback: () => createSpellSlot()
};
if (spellTotal > 0 && item.data.data.uses.value !== item.data.data.uses.max) buttonList[spellslot] = {    
    icon: '<i class="fas fa-brain"></i>',
    label:  "Sorcery Point(s)",
    callback: () => createSorcPoint()
};

new Dialog({
    title: "Font of Magic",
    content: `Convert to the following`,
    buttons: buttonList
}).render(true);

// Return Spell slots
function createSpellSlot() {
    // Get options for available slots
    for (let i = 1; i <= 9; i++) {
        let chosenSpellSlots = getSpellSlots(tactor, i);
        let minSlots = chosenSpellSlots?.value;
        let maxSlots = chosenSpellSlots?.max;
        if (maxSlots != (NaN || undefined || "" || 0) && sorcSpend[i] <= item.data.data.uses.value) {
            inputText += `<div class="form-group"><label for="spell${i}">Spell Slot Level ${i} [${minSlots}/${maxSlots}]</label><input id="spell${i}" name="spellSlot" value="${i}" type="radio"></div>`;
        }
    }

    new Dialog({
        title: "Font of Magic",
        content: `<form><p>Choose 1 spell slot to create.</p><hr>${inputText}</form>`,
        buttons: {
            recover: {
                icon: '<i class="fas fa-bolt"></i>',
                label: "Convert",
                callback: async (html) => {
                    let selected_slot = html.find('input[name="spellSlot"]:checked');
                    let slot = "";
                    let num = "";
                    for (let i = 0; i < selected_slot.length; i++) {
                        slot = selected_slot[i].id;
                        num = selected_slot[i].value;
                    }
                    if (slot === "") return ui.notifications.warn(`The ability fails, no spell slot was selected`);
                    spell_refund(tactor, slot);
                    let roll_results = `<div><i>Converted ${sorcSpend[num]} Sorcery points. Level ${num} spell slot restored.</i></div>`;
                    const chatMessage = game.messages.get(lastArg.itemCardId);
                    let content = duplicate(chatMessage.data.content);
                    const searchString = /<div class="midi-qol-saves-display">[\s\S]*<div class="end-midi-qol-saves-display">/g;
                    const replaceString = `<div class="midi-qol-saves-display"><div class="end-midi-qol-saves-display">${roll_results}`;
                    content = content.replace(searchString, replaceString);
                    chatMessage.update({ content: content });
                }
            }
        }
    }).render(true);

    async function spell_refund(tactor, slot) {
        let actorData = duplicate(tactor.data._source);
        actorData.data.spells[`${slot}`].value = Math.min(actorData.data.spells[`${slot}`].max, actorData.data.spells[`${slot}`].value + 1);
        await tactor.update(actorData);
        await item.update({"data.uses.value" : Math.max(0, item.data.data.uses.value - resourceConversion[slot])});
    }

    function getSpellSlots(tactor, level) {
        return tactor.data.data.spells[`spell${level}`];
    }
}

// Returns Sorc Points
function createSorcPoint() {
    // Get options for available slots
    for (let i = 1; i <= spellTotalMax.length; i++) {
        let chosenSpellSlots = getSpellSlots(tactor, i);
        let minSlots = chosenSpellSlots.value;
        let maxSlots = chosenSpellSlots.max;
        if (minSlots != 0) {
            inputText += `<div class="form-group"><label for="spell${i}">Spell Slot Level ${i} [${minSlots}/${maxSlots}]</label><input id="spell${i}" name="spellSlot" value="${i}" type="radio"></div>`;
        }
    }
    new Dialog({
        title: "Font of Magic",
        content: `<form><p>Choose 1 spell slot to convert.</p><hr>${inputText}</form>`,
        buttons: {
            recover: {
                icon: '<i class="fas fa-brain"></i>',
                label: "Convert",
                callback: async (html) => {
                    let selected_slot = html.find('input[name="spellSlot"]:checked');
                    let slot = "";
                    let num = "";
                    for (let i = 0; i < selected_slot.length; i++) {
                        slot = selected_slot[i].id;
                        num = selected_slot[i].value;
                    }
                    if (slot === "") return ui.notifications.warn(`The ability fails, no spell slot was selected`);
                    sorc_point_refund(tactor, slot, num);
                    let roll_results = `<div><i>Converted a Level ${num} spell slot. ${num} Sorcery points restored.</i></div>`;
                    const chatMessage = game.messages.get(lastArg.itemCardId);
                    let content = duplicate(chatMessage.data.content);
                    const searchString = /<div class="midi-qol-saves-display">[\s\S]*<div class="end-midi-qol-saves-display">/g;
                    const replaceString = `<div class="midi-qol-saves-display"><div class="end-midi-qol-saves-display">${roll_results}`;
                    content = content.replace(searchString, replaceString);
                    chatMessage.update({ content: content });
                    if ((game.modules.get("tokenmagic")?.active)) await TokenMagic.addUpdateFilters(tokenD, params);
                    if (!(game.modules.get("jb2a_patreon")?.active) && !(game.modules.get("sequencer")?.active)) return {};       
                }
            }
        }
    }).render(true);

    async function sorc_point_refund(tactor, slot, num) {
        let actorData = duplicate(tactor.data._source);
        actorData.data.spells[`${slot}`].value = Math.max(0, actorData.data.spells[`${slot}`].value - 1);
        await tactor.update(actorData);
        await item.update({"data.uses.value" : Math.min(item.data.data.uses.max, item.data.data.uses.value + parseInt(num))});
    }

    function getSpellSlots(tactor, level) {
        return tactor.data.data.spells[`spell${level}`];
    }
}