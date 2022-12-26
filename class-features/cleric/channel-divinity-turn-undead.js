// channel divinity turn undead
// on use

async function cr_lookup(level) {
    return level > 20 ? 5 : level >= 17 ? 4 : level >= 14 ? 3 : level >= 11 ? 2 : level >= 8 ? 1 : level >= 5 ? 0.5 : 0;
}

if (!game.modules.get("warpgate")?.active) return ui.notifications.error("Turn Undead requires warpgate module");

const lastArg = args[args.length - 1];
const actorD = canvas.tokens.get(lastArg.tokenId).actor;
const rollData = actorD.getRollData();
const level = rollData.details.cr ?? rollData.classes.cleric.levels;
const DC = 8 + rollData.attributes.prof + rollData.abilities.wis.mod;
const saveType = "wis";
const itemD = lastArg.item;
const gameRound = game.combat ? game.combat.round : 0;

const targetList = lastArg.targets.reduce((list, target) => {
    let creatureTypes = ["undead"];
    let undead = target.actor.type === "character" ? creatureTypes.some(i => (target.actor.data.data.details.race || "").toLowerCase().includes(i)) : creatureTypes.some(i => (target.actor.data.data.details.type.value || "").toLowerCase().includes(i));
    if (!undead && target.actor.type === "character" && target.actor.data.data.details.race === (undefined || null)) {
        return list;
    } else if (!undead && target.actor.type === "npc" && target.actor.data.data.details.type.value === (undefined || null)) {
        return list;
    } else if (!undead && target.actor.type === "npc" && target.actor.data.data.details.type.value === "custom") {
        undead = creatureTypes.some(i => (target.actor.data.data.details.type.subtype || target.actor.data.data.details.type.custom).toLowerCase().includes(i));
        if (!undead) {
            return list;
        }
    };
    if (undead) list.push(target);
    return list;
}, []);

if (targetList.length === 0) {
    ui.notifications.warn(`${itemD.name} was unable to find any valid targets`);
}

let turnTargets = [];

for (let target of targetList) {
    let mon_cr = target.actor.getRollData().details.cr;
    let level_cr = await cr_lookup(level);
    let resist = ["Turn Resistance", "Turn Defiance"];
    let getResistance = target.actor.items.find(i => resist.includes(i.name));
	if (!getResistance) getResistance = target.actor.effects.find(i => resist.includes(i.data.label));
    let immunity = ["Turn Immunity"];
    let getImmunity = target.actor.items.find(i => immunity.includes(i.name));
    if (!getImmunity) {
        if (getResistance) {
            let hook = Hooks.on("Actor5e.preRollAbilitySave", async (actor, rollData, abilityId) => {
                if (actor === target.actor && abilityId === saveType) {
                    rollData.advantage = true;
                    Hooks.off("Actor5e.preRollAbilitySave", hook);
                }
            });
        }
        const itemData = {
            name: `${itemD.name} Save`,
            img: itemD.img,
            type: "feat",
            flags: {
                midiProperties: { magiceffect: true, }
            },
            data: {
                activation: { type: "none", },
                target: { type: "self", },
                actionType: "save",
                save: { dc: DC, ability: saveType, scaling: "flat" },
            }
        }
        await USF.socket.executeAsGM("createItem", { actorUuid: target.actor.uuid, itemData: itemData });
        let saveItem = await target.actor.items.find(i => i.name === itemData.name);
        let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
        await USF.socket.executeAsGM("deleteItem", { itemUuid: saveItem.uuid });
        if (saveWorkflow.failedSaves.size) {
            if (level_cr >= mon_cr) {
                await USF.socket.executeAsGM("updateActor", { actorUuid: target.actor.uuid, updates: {"data.attributes.hp.value" : 0} });
            } else {   
                let effectData = {
                    label: "Turn Undead",
                    icon: "icons/svg/stoned.svg",
                    origin: args[0].uuid,
                    disabled: false,
                    duration: { rounds: 10, startRound: gameRound, startTime: game.time.worldTime },
                    flags: { dae: { specialDuration: ["isDamaged"] } }
			    };
                let effect = target.actor.effects.find(i => i.data.label === "Turn Undead");
                if (!effect) {
                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });
                }
            }
        }
    }
}