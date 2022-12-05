// apply damage macro
// args: 
// [1] - source actorUuid (string: [actorUuid] or "self")
// [2] - target tokenUuid (string: [tokenUuid] or "self")
// [3] - damage application type (string: "other" or "save")
// [4] - damage rollable (string: i.e., "2d6", "5", ...)
// [5] - damage type (string: i.e., "cold", "fire", ...)
// [6] - magic effect (string: "magiceffect" or EMPTY)
// [7] - spell effect (string: "spelleffect" or EMPTY)
// [8] - save dc (int: i.e., 10, 15, ... or EMPTY)
// [9] - save type (string: i.e., "dex", "wis", ... or EMPTY)
// [10] - save damage (string: "fulldam", "halfdam", "nodam", or EMPTY)

if (args[0] === "on" || args[0] === "off") return;

const lastArg = args[args.length - 1];

let sourceUuid;
if (args[1] === "self") {
	sourceUuid = lastArg.actorUuid;
} else {
	sourceUuid = args[1];
}

let targetUuid;
if (args[2] === "self") {
	targetUuid = lastArg.tokenUuid;
} else {
	targetUuid = args[2];
}

if (args[3] === "save") {
	let resist = [];
	if (args[5].toLowerCase === "poison") resist.push("Dwarven Resilience", "Duergar Resilience", "Stout Resilience", "Poison Resilience");
	if (args[5] === "spelleffect") {
	    resist.push("Spell Resilience", "Spell Resistance", "Magic Resilience", "Magic Resistance");
	} else if (args[4] === "magiceffect") {
	    resist.push("Magic Resilience", "Magic Resistance");
	}
	const getResist = targetActor.items.find(i => resist.includes(i.name)) || tactor.effects.find(i => resist.includes(i.data.label));
	if (getResist) {
        const effectData = {
            changes: [{ key: "flags.midi-qol.advantage.ability.save.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
            disabled: false,
            flags: { dae: { specialDuration: ["isSave"] } },
            icon: args[0].item.img,
            label: "Damage Save Advantage",
        }
        await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
	}
}

const itemData = {
    name: `${args[5].charAt(0).toUpperCase() + args[5].slice(1)}`,
    img: "icons/svg/fire.svg",
    type: "feat",
    data: {
        "activation.type": "none",
        actionType: args[3],
        damage: { parts: [[args[4], args[5]]] },
        save: { dc: args[7], ability: args[8], scaling: "flat" },
    }
}
if (args[6] === "magiceffect") itemData.flags.midiProperties.magiceffect = true;
if (args[7] === "spelleffect") itemData.flags.midiProperties.spelleffect = true;
if (args[10]) itemData.flags.midiProperties[args[10]] = true;
const item = new CONFIG.Item.documentClass(itemData, { parent: sourceUuid });
const options = { showFullCard: false, createWorkflow: true, configureDialog: false, targetUuids: [targetUuid] };
await MidiQOL.completeItemRoll(item, options);