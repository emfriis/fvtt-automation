// font of magic
// requires MIDI-QOL

const lastArg = args[args.length - 1];
const tokenD = canvas.tokens.get(lastArg.tokenId);
const actorD = tokenD.actor;
const itemD = lastArg.item;
let inputText = "";
const resourceList = [{ name: "primary" }, { name: "secondary" }, { name: "tertiary" }];
const resourceValues = Object.values(actorD.data.data.resources);
const resourceTable = mergeObject(resourceList, resourceValues);
const abilityName = "Sorcery Points";
const findResourceSlot = resourceTable.find(i => i.label.toLowerCase() === abilityName.toLowerCase());
if(!findResourceSlot) return ui.notifications.error(`<strong>REQUIRED</strong>: Please add "<strong>${abilityName}</strong>" as one of your <strong>Resources</strong>.`);
const resourceSlot = findResourceSlot.name;
const resourceConversion = { spell1: 2, spell2: 3, spell3: 5, spell4: 6, spell5: 7 };
const sorcSpend = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 };
const currentResource = parseInt(actorD.data.data.resources[resourceSlot].value || 0);
const currentResourceMax = actorD.data.data.resources[resourceSlot].max;
const params = [{
    filterType: "glow",
    filterId: "abilityG",
    outerStrength: 2,
    innerStrength: 0,
    color: 0x800080,
    quality: 1,
    padding: 10,
    autoDestroy: true,
    animated:
    {
        color: 
        {
           active: true,
           loops: 1, 
           loopDuration: 700, 
           animType: "colorOscillation", 
           val1:0xFAA0A0, 
           val2:0xFF3131
        }
    }
}];


// Checking for totals
const keys = Object.keys(actorD.data.data.spells);
const spellTotal = keys.reduce((acc, values, i) => {
    let x = 0;
    if ((i >= 0 && i < 6) && (values != ("pact"))) {
        x = parseInt(Object.values(actorD.data.data.spells)[i].value || 0);
    }
    return acc + x;
}, 0);

const spellTotalMax = keys.reduce((acc, values, i) => {
    let spellMax = values;
    if (spellMax != "spell0" && spellMax != "pact") {
        acc.push(Object.values(actorD.data.data.spells)[i].max);
    }
    return acc;
}, []);

let buttonList = {};
let spellslot = "spellslot";
let sorcslot = "sorcslot";

if ((currentResource <= 1) && (spellTotal === 0)) return ui.notifications.error(`You do not have enough Spells Slots or Sorcery Points to do anything`);

if (currentResource > 1) buttonList[sorcslot] = {
    icon: '<i class="fas fa-bolt"></i>',
    label: "Spell Slot",
    callback: () => createSpellSlot()
};
if (spellTotal > 0 && currentResource != currentResourceMax) buttonList[spellslot] = {    
    icon: '<i class="fas fa-brain"></i>',
    label:  "Sorcery Point(s)",
    callback: () => createSorcPoint()
};

new Dialog({
    title: itemD.name,
    content: `Convert to the following`,
    buttons: buttonList
}).render(true);

// Return Spell slots
function createSpellSlot() {
    // Get options for available slots
    for (let i = 1; i <= 9; i++) {
        let chosenSpellSlots = getSpellSlots(actorD, i);
        let minSlots = chosenSpellSlots?.value;
        let maxSlots = chosenSpellSlots?.max;
        if (maxSlots != (NaN || undefined || "" || 0) && sorcSpend[i] <= currentResource) {
            inputText += `<div class="form-group"><label for="spell${i}">Spell Slot Level ${i} [${minSlots}/${maxSlots}]</label><input id="spell${i}" name="spellSlot" value="${i}" type="radio"></div>`;
        }
    }

    new Dialog({
        title: itemD.name,
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
                    spell_refund(actorD, slot);
                    let roll_results = `<div><i>Converted ${sorcSpend[num]} Sorcery points. Level ${num} spell slot restored.</i></div>`;
                    const chatMessage = game.messages.get(lastArg.itemCardId);
                    let content = duplicate(chatMessage.data.content);
                    const searchString = /<div class="midi-qol-saves-display">[\s\S]*<div class="end-midi-qol-saves-display">/g;
                    const replaceString = `<div class="midi-qol-saves-display"><div class="end-midi-qol-saves-display">${roll_results}`;
                    content = content.replace(searchString, replaceString);
                    chatMessage.update({ content: content });
                    if ((game.modules.get("tokenmagic")?.active)) await TokenMagic.addUpdateFilters(tokenD, params);
                    if (!(game.modules.get("jb2a_patreon")?.active) && !(game.modules.get("sequencer")?.active)) return {};                    
                    new Sequence()
                        .effect()
                        .file("jb2a.toll_the_dead.blue.shockwave")
                        .atLocation(tokenD)
                        .belowTokens()
                        .fadeIn(300)
                        .fadeOut(300)
                        .scaleToObject(2.5)
                        .waitUntilFinished(-500)
                        .play()
                }
            }
        }
    }).render(true);

    async function spell_refund(actorD, slot) {
        let actor_data = duplicate(actorD.data._source);
        actor_data.data.spells[`${slot}`].value = actor_data.data.spells[`${slot}`].value + 1;
        actor_data.data.resources[resourceSlot].value = Math.max(0, currentResource - resourceConversion[slot]);
        await actorD.update(actor_data);
    }

    function getSpellSlots(actorD, level) {
        return actorD.data.data.spells[`spell${level}`];
    }
}

// Returns Sorc Points
function createSorcPoint() {
    // Get options for available slots
    for (let i = 1; i <= spellTotalMax.length; i++) {
        let chosenSpellSlots = getSpellSlots(actorD, i);
        let minSlots = chosenSpellSlots.value;
        let maxSlots = chosenSpellSlots.max;
        if (minSlots != 0) {
            inputText += `<div class="form-group"><label for="spell${i}">Spell Slot Level ${i} [${minSlots}/${maxSlots}]</label><input id="spell${i}" name="spellSlot" value="${i}" type="radio"></div>`;
        }
    }
    new Dialog({
        title: itemD.name,
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
                    sorc_point_refund(actorD, slot, num);
                    let roll_results = `<div><i>Converted a Level ${num} spell slot. ${num} Sorcery points restored.</i></div>`;
                    const chatMessage = game.messages.get(lastArg.itemCardId);
                    let content = duplicate(chatMessage.data.content);
                    const searchString = /<div class="midi-qol-saves-display">[\s\S]*<div class="end-midi-qol-saves-display">/g;
                    const replaceString = `<div class="midi-qol-saves-display"><div class="end-midi-qol-saves-display">${roll_results}`;
                    content = content.replace(searchString, replaceString);
                    chatMessage.update({ content: content });
                    if ((game.modules.get("tokenmagic")?.active)) await TokenMagic.addUpdateFilters(tokenD, params);
                    if (!(game.modules.get("jb2a_patreon")?.active) && !(game.modules.get("sequencer")?.active)) return {};                    
                    new Sequence()
                        .effect()
                        .file("jb2a.toll_the_dead.green.shockwave")
                        .atLocation(tokenD)
                        .belowTokens()
                        .fadeIn(300)
                        .fadeOut(300)
                        .scaleToObject(2.5)
                        .waitUntilFinished(-500)
                        .play()
                }
            }
        }
    }).render(true);

    async function sorc_point_refund(actorD, slot, num) {
        let actor_data = duplicate(actorD.data._source);
        actor_data.data.spells[`${slot}`].value = actor_data.data.spells[`${slot}`].value - 1;
		let actorData = actorD.getRollData();
        let resourceMax = actorData.classes.sorcerer.levels;  
        actor_data.data.resources[resourceSlot].value = Math.min(resourceMax, actor_data.data.resources[resourceSlot].value + parseInt(num));
        await actorD.update(actor_data);
    }

    function getSpellSlots(actorD, level) {
        return actorD.data.data.spells[`spell${level}`];
    }
}