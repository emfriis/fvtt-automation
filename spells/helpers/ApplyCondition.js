// apply condition macro
// args: 
// [1] - source actorUuid (string: [actorUuid] or "self")
// [2] - target tokenUuid (string: [tokenUuid] or "self")
// [3] - condition application type (string: "other" or "save")
// [4] - condition name (string: i.e., "Prone", "Stunned")
// [5] - duration seconds (int: i.e, 60, 600, ... or "null")
// [6] - duration special (string: i.e., "isDamaged", "1Attack", ... or "null")
// [7] - magic effect (string: "magiceffect" or "no" or EMPTY)
// [8] - spell effect (string: "spelleffect" or "no" or EMPTY)
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
	const getResist = targetActor.items.find(i => resist.includes(i.name)) || targetActor.effects.find(i => resist.includes(i.data.label));
	if (getResist) {
        
	}
}

