// apply condition macro
// args: 
// [1] - source actorUuid (string: [actorUuid] or "self")
// [2] - target tokenUuid (string: [tokenUuid] or "self")
// [3] - condition application type (string: "other" or "save")
// [4] - condition name (string: i.e., "Prone", "Stunned")
// [5] - duration seconds (int: i.e, 60, 600, ... or "null")
// [6] - duration special (string: i.e., "isDamaged", "1Attack", ... or "null")
// [7] - magic effect (string: "magiceffect" or EMPTY)
// [8] - spell effect (string: "spelleffect" or EMPTY)
// [9] - save dc (int: i.e., 10, 15, ... or EMPTY)
// [10] - save type (string: i.e., "dex", "wis", ... or EMPTY)
// [11] - attempt removal data (string: i.e., "" or EMPTY)

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
const targetTokenOrActor = await fromUuid(targetUuid);
const targetActor = targetTokenOrActor.actor ? targetTokenOrActor.actor : targetTokenOrActor;

if (args[3] === "save") {
	let resist = [];
	switch(args[4]) {
		case "Blinded":
      		resist.push("Blindness Resilience");
      		break;
 	  	case "Charmed": 
            resist.push("Fey Ancestry", "Duergar Reslience", "Charm Resilience");
            break;
  	  	case "Deafened":
            resist.push("Deafness Resilience");
            break;
   	 	case "Frightened":
            resist.push("Brave", "Fear Resilience");
            break;
   	 	case "Grappled":
            resist.push("Grapple Resilience");
            break;
   	 	case "Incapacitated":
            resist.push("Incapacitation Resilience");
            break;
        case "Paralyzed":
            resist.push("Duergar Resilience", "Paralysis Resilience");
            break;
        case "Poisoned":
            resist.push("Dwarven Resilience", "Duergar Resilience", "Stout Resilience", "Poison Resilience");
            break;
        case "Prone":
            resist.push("Sure-Footed", "Prone Resilience");
            break;
        case "Restrained":
            resist.push("Restraint Resilience");
            break;
        case "Stunned":
            resist.push("Stun Resilience");
	}
	if (args[8] === "spelleffect") {
        resist.push("Spell Resilience", "Spell Resistance", "Magic Resilience", "Magic Resistance");
	} else if (args[7] === "magiceffect") {
        resist.push("Magic Resilience", "Magic Resistance");
	}
	const getResist = targetActor.items.find(i => resist.includes(i.name)) || tactor.effects.find(i => resist.includes(i.data.label));
	if (getResist) {
        const effectData = {
            changes: [{ key: "flags.midi-qol.advantage.ability.save.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
            disabled: false,
            flags: { dae: { specialDuration: ["isSave"] } },
            icon: args[0].item.img,
            label: `${args[4]} Save Advantage`,
        };
        await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
	}
}

const itemData = {
    name: `${args[4].charAt(0).toUpperCase() + args[4].slice(1)}`,
    img: "icons/svg/aura.svg",
    type: "feat",
	effects: [
		{
			changes: [{ key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `Convenient Effect: ${args[4]}`, priority: 20, }],
            disabled: false,
			duration: { seconds: (parseInt(args[5]).isNaN ? null : parseInt(args[5])) },
            flags: { dae: { specialDuration: [args[6]] } },
            label: args[4],
		}
	],
    data: {
        "activation.type": "none",
        actionType: args[3],
        save: { dc: args[9], ability: args[10], scaling: "flat" },
    }
}
if (args[7] === "magiceffect") itemData.flags.midiProperties.magiceffect = true;
if (args[8] === "spelleffect") itemData.flags.midiProperties.spelleffect = true;
if (args[11]) itemData.effects[0].changes.push({ key: "Macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `AttemptRemoval ${args[11].replace(",", " ")}`, priority: 20, });
const item = new CONFIG.Item.documentClass(itemData, { parent: sourceUuid });
const options = { showFullCard: false, createWorkflow: true, configureDialog: false, targetUuids: [targetUuid] };
await MidiQOL.completeItemRoll(item, options);