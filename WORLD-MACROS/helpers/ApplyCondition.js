// apply condition macro
// execute as gm
// args: 
// [1] - target tokenUuid (string: [tokenUuid] or "self")
// [2] - condition application type (string: "other" or "save")
// [3] - condition name (string: i.e., "Prone", "Stunned")
// [4] - save dc (int: i.e., 10, 15, ...)
// [5] - save type (string: i.e., "dex", "wis", ...
// [6] - duration seconds (int: i.e, 60, 600, ... or "no" or EMPTY)
// [7] - duration special (string: i.e., "isDamaged", "1Attack", ... or "no" or EMPTY)
// [8] - magic effect (string: "magiceffect" or "no" or EMPTY)
// [9] - spell effect (string: "spelleffect" or "no" or EMPTY)
// [10] - attempt removal data (string: i.e., "10,save,con,auto", "12,abil,str,opt", ... or EMPTY)
// [11] - attempt removal timing (string: i.e., "startEveryTurn" or "endEveryTurn" or EMPTY)

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

if (args[0] === "on" || args[0] === "off") return;

const lastArg = args[args.length - 1];

let targetUuid;
if (args[1] === "self") {
	targetUuid = lastArg.tokenUuid;
} else {
	targetUuid = args[1];
}
const targetTokenOrActor = await fromUuid(targetUuid);
const targetActor = targetTokenOrActor.actor ? targetTokenOrActor.actor : targetTokenOrActor;

if (args[2] === "save") {
	let resist = [];
	switch(args[3]) {
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
	if (args[9] === "spelleffect") {
        resist.push("Spell Resilience", "Spell Resistance", "Magic Resilience", "Magic Resistance");
	} else if (args[8] === "magiceffect") {
        resist.push("Magic Resilience", "Magic Resistance");
	}
	const getResist = targetActor.items.find(i => resist.includes(i.name)) || targetActor.effects.find(i => resist.includes(i.data.label));

    const targetPlayer = await playerForActor(targetActor);
    const rollOptions = getResist ? { chatMessage: true, fastForward: true, advantage: true } : { chatMessage: true, fastForward: true };
    const roll = await MidiQOL.socket().executeAsUser("rollAbility", targetPlayer.id, { request: "save", targetUuid: targetActor.uuid, ability: args[5], options: rollOptions }); 
    
    if (roll.total < dc) {
        const effectData = {
			changes: [
				{ key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Grappled", priority: 20, },
				{ key: "macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `Grapple ${source.uuid}`, priority: 20, }
			],
            duration: null,
            disabled: false,
			flags: { dae: { macroRepeat: null, specialDuration: null } }
		}
        if (args[6]) effectData.duration = { seconds: args[6] };
        if (args[7]) effectData.flags.dae.specialDuration = args[7];
        if (args[10]) {
            effectData.changes.push({ key: "macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `AttemptRemoval ${args[10].replace(",", " ")}`, priority: 20, });
            if (args[11]) effectData.flags.dae.macroRepeat = args[11];
        }
    }
}

