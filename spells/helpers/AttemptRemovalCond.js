// macro.itemMacro, values : dc(int) abil(string) type(str) auto/opt(str)

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const item = await fromUuid(lastArg.efData.origin);
const condition = lastArg.efData.label;
let resist = [];
switch(condition) {
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
if (item.data.type === "spell") {
    resist.push("Spell Resilience", "Spell Resistance", "Magic Resilience", "Magic Resistance");
} else if (item.data.data?.properties?.mgc || item.data.flags.midiProperties.magiceffect) {
    resist.push("Magic Resilience", "Magic Resistance");
}
const getResist = tactor.items.find(i => resist.includes(i.name)) || tactor.effects.find(i => resist.includes(i.data.label));

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
};

async function attemptRemoval(getResist) {
    const dc = args[1];
    const abil = args[2];
    const type = args[3]; // can be "abil", "save", or "skill"
    const rollOptions = getResist ? { chatMessage: true, fastForward: true, advantage: true } : { chatMessage: true, fastForward: true };
    const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: type, targetUuid: tactor.uuid, ability: abil, options: rollOptions });
    if (game.dice3d) game.dice3d.showForRoll(roll);
    if (roll.total >= dc) {
        let ef = tactor.effects.find(i => i.data === lastArg.efData);
		if (ef) await tactor.deleteEmbeddedDocuments("ActiveEffect", [ef.id]);
    } else {
        if (roll.total < dc) ChatMessage.create({ content: `${tactor.name} fails the roll and still has the ${condition} condition.` });
    }
}

if (args[0] === "each" && lastArg.efData.disabled === false) {
    if (args[4] === "opt") {
        let player = await playerForActor(tactor);
        let socket = socketlib.registerModule("user-socket-functions");
        let attempt = false;
        attempt = await socket.executeAsUser("useDialog", player.id, { title: `Use action to attempt to remove ${condition}?`, content: `` });
        if (attempt) {
            attemptRemoval();
        }
    } else if (args[4] === "auto") {
        attemptRemoval();
    }
}