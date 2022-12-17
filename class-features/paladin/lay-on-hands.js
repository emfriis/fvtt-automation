// lay on hands
// requires MIDI-QOL
// requires 'Lay on Hands' to be the label of the primary, secondary, or tertiary resource

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

const lastArg = args[args.length - 1];
if (lastArg.targets.length === 0) return ui.notifications.error(`Please select a single target.`);
let target = canvas.tokens.get(lastArg.targets[0].id);
let creatureTypes = ["undead", "construct"];
let illegal = creatureTypes.some(i => (target.actor.data.data.details.race || target.actor.data.data.details.type.value).toLowerCase().includes(i));
let actorD = game.actors.get(lastArg.actor._id);
let tokenD = canvas.tokens.get(lastArg.tokenId);
let itemD = lastArg.item;
let resourceList = [{ name: "primary" }, { name: "secondary" }, { name: "tertiary" }];
let resourceValues = Object.values(actorD.data.data.resources);
let resourceTable = mergeObject(resourceList, resourceValues);
let findResourceSlot = resourceTable.find(i => i.label.toLowerCase() === itemD.name.toLowerCase());
if (!findResourceSlot) return ui.notifications.error(`${itemD.name} Resources is missing on ${tokenD.name}, Add it.`);
let resourceSlot = findResourceSlot.name;
let curtRes = actorD.data.data.resources[resourceSlot].value;
let maxResRnd = actorD.data.data.resources[resourceSlot].max / 5;
let curtResRnd = Math.floor(actorD.data.data.resources[resourceSlot].value / 5);
let maxHealz = Math.clamped(actorD.data.data.resources[resourceSlot].value, 0, target.actor.data.data.attributes.hp.max - target.actor.data.data.attributes.hp.value);
if (illegal) return ui.notifications.error(`You cannot use ${itemD.name} on this target.`);
if (curtRes === null) return ui.notifications.warn(`You are out of the required resources for ${itemD.name}.`);
let content_loh = `<p>Which <strong>Action</strong> would you like to do? [${curtRes}] points remaining.</p>`;
new Dialog({
    title: itemD.name,
    content: content_loh,
    buttons: {
        cure: { label: "Cure Condition", callback: () => loh_cure() },
        heal: { label: "Heal", callback: () => loh_heal() }
    },
    default: "heal"
}).render(true);

// Condition Curing Function
function loh_cure() {
    let condition_list = ["Diseased", "Poisoned"];
    let effect = target.actor.effects.filter(i => condition_list.includes(i.data.label));
    let selectOptions = "";
    for (let i = 0; i < effect.length; i++) {
        let condition = effect[i].data.label;
        selectOptions += `<option value="${condition}">${condition}</option>`;
    }
    if (selectOptions === "") {
        return ui.notifications.warn(`There's nothing to Cure on ${target.name}.`);
    } else {
        let content_cure = `<p><em>${tokenD.name} ${itemD.name} on ${target.name}.</em></p><p>Choose a Condition Cure | [${curtResRnd}/${maxResRnd}] charges left.</p><form class="flexcol"><div class="form-group"><select id="element">${selectOptions}</select></div></form>`;
        new Dialog({
            title: `${itemD.name}: Curing`,
            content: content_cure,
            buttons: {
                cure: {
                    icon: '<i class="fas fa-check"></i>',
                    label: 'Cure!',
                    callback: async (html) => {
                        let element = html.find('#element').val();
                        let effect = target.actor.effects.find(i => i.data.label === element);
                        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: target.actor.uuid, effects: [effect.id] });
                        await updateRec(actorD, resourceSlot, curtRes, 5);
                        let chatContent = `<div class="midi-qol-nobox"><div class="midi-qol-flex-container"><div>Cures ${element}:</div><div class="midi-qol-target-npc midi-qol-target-name" id="${target.data.id}"> ${target.name}</div><div><img src="${target.data.img}" width="30" height="30" style="border:0px"></img></div></div></div>`;
                        await wait(500);
                        let chatMessage = game.messages.get(lastArg.itemCardId);
                        let content = duplicate(chatMessage.data.content);
                        let searchString = /<div class="midi-qol-hits-display">[\s\S]*<div class="end-midi-qol-hits-display">/g;
                        let replaceString = `<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display">${chatContent}`;
                        content = content.replace(searchString, replaceString);
                        chatMessage.update({ content: content });
                    }
                }
            },
            default: "cure"
        }).render(true);
    }
}
// Healing Function
function loh_heal() {
    let content_heal = `<p><em>${tokenD.name} lays hands on ${target.name}.</em></p><p>How many HP do you want to restore to ${target.name}?</p><form class="flexcol"><div class="form-group"><label for="num">HP to Restore: (Max = ${maxHealz})</label><input id="num" name="num" type="number" min="0" max="${maxHealz}"></input></div></form>`;
    new Dialog({
        title: `${itemD.name}: Healing`,
        content: content_heal,
        buttons: {
            heal: {
                icon: '<i class="fas fa-check"></i>', label: 'Heal', callback: async (html) => {
                    let number = Math.floor(Number(html.find('#num')[0].value));
                    if (number < 1 || number > maxHealz) {
                        return ui.notifications.warn(`Invalid number of charges entered = ${number}. Aborting action.`);
                    } else {
                        let damageRoll = new Roll(`${number}`).evaluate({ async: false });
                        await new MidiQOL.DamageOnlyWorkflow(actorD, tokenD, damageRoll.total, "healing", [target], damageRoll, { flavor: `(Healing)`, itemCardId: lastArg.itemCardId });
                        await updateRec(actorD, resourceSlot, curtRes, number);
                    }
                }
            }
        },
        default: "heal"
    }).render(true);
}

async function updateRec(actorD, resourceSlot, curtRes, number) {
    let updates = {};
    let resources = `data.resources.${resourceSlot}.value`;
    updates[resources] = curtRes - number;
    await actorD.update(updates);
}