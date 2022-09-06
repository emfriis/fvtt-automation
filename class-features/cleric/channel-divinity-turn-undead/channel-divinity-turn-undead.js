/////////////////////////////////////////////////
// READ FIRST
// Requires: Callback macros ActorUpdate
////////////////////////////////////////////////
async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
async function cr_lookup(level) {
    return level > 20 ? 5 : level >= 17 ? 4 : level >= 14 ? 3 : level >= 11 ? 2 : level >= 8 ? 1 : level >= 5 ? 0.5 : 0;
}
if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Turn Undead requires warpgate module");

const lastArg = args[args.length - 1];
const actorD = canvas.tokens.get(lastArg.tokenId).actor;
const rollData = actorD.getRollData();
const level = rollData.details.cr ?? rollData.classes.cleric.levels;
const DC = rollData.attributes.spelldc;
const saveType = rollData.attributes.spellcasting;
const itemD = lastArg.item;
const gameRound = game.combat ? game.combat.round : 0;

console.warn(`###### ${itemD.name} Workflow Started #####`);

const targetList = lastArg.targets.reduce((list, target) => {
    let creatureTypes = ["undead"];
    let undead = target.actor.type === "character" ? creatureTypes.some(i => (target.actor.data.data.details.race || "").toLowerCase().includes(i)) : creatureTypes.some(i => (target.actor.data.data.details.type.value || "").toLowerCase().includes(i));
    if (!undead && target.actor.type === "character" && target.actor.data.data.details.race === (undefined || null)) {
        console.error(`=>`, `Invalid Target`, target.name, `| Skipped: Race mismatch`, `| Result:`, target.actor.data.data.details.race);
        return list;
    } else if (!undead && target.actor.type === "npc" && target.actor.data.data.details.type.value === (undefined || null)) {
        console.error(`=>`, `Invalid Target`, target.name, `| Skipped: Type mismatch`, `| Result:`, target.actor.data.data.details.type.value);
        return list;
    } else if (!undead && target.actor.type === "npc" && target.actor.data.data.details.type.value === "custom") {
        undead = creatureTypes.some(i => (target.actor.data.data.details.type.subtype || target.actor.data.data.details.type.custom).toLowerCase().includes(i));
        if (!undead) {
            console.error(`=>`, `Invalid Target`, target.name, `| Skipped: Custom Type mismatch`, `| Result:`, target.actor.data.data.details.type.custom, `(${target.actor.data.data.details.type.subtype})`);
            return list;
        }
    };
    console.warn(`=>`, `Target Found:`, target.name, `| Creature Type:`, target.actor.type === "character" ? target.actor.data.data.details.race : target.actor.data.data.details.type.value);
    if (undead) list.push(target);
    return list;
}, []);

if (targetList.length === 0) {
    ui.notifications.warn(`${itemD.name} was unable to find any valid targets`);
    console.error(`${itemD.name} was unable to find any valid targets`);
    return console.error(`##### ${itemD.name} Workflow Aborted #####`);
}

let turnTargets = [];

for (let target of targetList) {
    let mon_cr = target.actor.getRollData().details.cr;
    let level_cr = await cr_lookup(level);
    // add turn resist terms
    let resist = ["Turn Resistance", "Turn Defiance"];
    let getResistance = target.actor.items.find(i => resist.includes(i.name));
	if (!getResistance) getResistance = target.actor.effects.find(i => resist.includes(i.data.label));
    let immunity = ["Turn Immunity"];
    let getImmunity = target.actor.items.find(i => immunity.includes(i.name));
    let getAdvantage = getResistance ? { advantage: true, chatMessage: false, fastForward: true } : { chatMessage: false, fastForward: true };
    let save = await MidiQOL.socket().executeAsGM("rollAbility", { request: "save", targetUuid: target.actor.uuid, ability: saveType, options: getAdvantage });
    if (getImmunity) {
        console.warn(`=>`, `Target Processed:`, target.name, `| CR:`, mon_cr, `| Result: Immune`);
        turnTargets.push(`<div class="midi-qol-flex-container"><div class="midi-qol-target-npc midi-qol-target-name" id="${target.id}">${target.name} is immune</div><div><img src="${target.data.img}" width="30" height="30" style="border:0px"></div></div>`);
    } else {
        if (save.total < DC) {
            if (level_cr >= mon_cr) {
                console.warn(`=>`, `Target Processed:`, target.name, `| CR:`, mon_cr, `| DC:`, DC, `| Save:`, save.total, `[Fail]`, `| Result: Destroyed`);
                turnTargets.push(`<div class="midi-qol-flex-container"><div class="midi-qol-target-npc midi-qol-target-name" id="${target.id}">${target.name} fails with ${save.total} [D]</div><div><img src="${target.data.img}" width="30" height="30" style="border:0px"></div></div>`);
                let maxHP = Number(target.actor.data.data.attributes.hp.max);
                let updates = {
                    actor: { "data.attributes.hp.value": 0, "data.attributes.hp.max": maxHP }
                };
                let mutateCallbacks = "";
                await warpgate.mutate(target, updates, mutateCallbacks, { permanent: true });
            } else {   
				let condition = "Frightened";
                console.warn(`=>`, `Target Processed:`, target.name, `| CR:`, mon_cr, `| DC:`, DC, `| Save:`, save.total, `[Fail]`, `| Result: ${condition}`);
                let effectData = {
				label: condition,
				icon: "icons/svg/terror.svg",
				origin: args[0].uuid,
				disabled: false,
				flags: { dae: { specialDuration: ["turnEndSource"] } },
				changes: [{ key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Frightened", priority: 20 }]
			};
                let effect = target.actor.effects.find(i => i.data.label === condition);
                if (!effect) {
                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });
                    console.warn(`>`, target.name, `Applying: ${condition} Condition`, `Success`);
                } else {
                    console.error(`>`, target.name, `Applying: ${condition} Condition`, `Failure`);
                }
                turnTargets.push(`<div class="midi-qol-flex-container"><div class="midi-qol-target-npc midi-qol-target-name" id="${target.id}">${target.name} fails with ${save.total} [F]</div><div><img src="${target.data.img}" width="30" height="30" style="border:0px"></div></div>`);
            }
        } else {
            console.warn(`=>`, `Target Skipped:`, target.name, `| CR:`, mon_cr, `| DC:`, DC, `| Save:`, save.total, `[Skipped]`, `| Result: Save`);
            turnTargets.push(`<div class="midi-qol-flex-container"><div class="midi-qol-target-npc midi-qol-target-name" id="${target.id}">${target.name} saves with ${save.total}</div><div><img src="${target.data.img}" width="30" height="30" style="border:0px"></div></div>`);
        }
    }
}
console.warn(`##### ${itemD.name} Workflow Completed #####`);
await wait(600);
let turn_results = `<div class="midi-qol-nobox midi-qol-bigger-text">${CONFIG.DND5E.abilities[saveType]} Saving Throw: DC ${DC}</div><div><div class="midi-qol-nobox">${turnTargets.join('')}</div></div>`;
let chatMessage = await game.messages.get(lastArg.itemCardId);
let content = await duplicate(chatMessage.data.content);
let searchString = /<div class="midi-qol-hits-display">[\s\S]*<div class="end-midi-qol-hits-display">/g;
let replaceString = `<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display">${turn_results}`;
content = await content.replace(searchString, replaceString);
await chatMessage.update({ content: content });
await ui.chat.scrollBottom();