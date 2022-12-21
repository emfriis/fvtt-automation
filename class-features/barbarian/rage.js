// rage
// effect itemacro
// effect on use pre attack
// damage bonus

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const actorData = tactor.getRollData();
const barbarian = actorData.details?.cr ?? actorData.classes?.barbarian?.levels;
if (!barbarian) return;

if (args[0] === "each") {
	if ((!tactor.data.flags["midi-qol"].rageAttacked && !tactor.data.flags["midi-qol"].rageAttacked && barbarian < 15) || tactor.effects.find(e => e.data.label === "Unconscious")) {
		await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [lastArg.effectId] });
	} else {
		if (tactor.data.flags["midi-qol"].rageAttacked) await tactor.unsetFlag("midi-qol", "rageAttacked");
		if (tactor.data.flags["midi-qol"].rageDamaged) await tactor.unsetFlag("midi-qol", "rageDamaged");
	}
}

if (args[0].tag === "OnUse" && args[0].macroPass === "preAttackRoll" && barbarian < 15) {
	if (["mwak", "rwak", "msak", "rsak"].includes(lastArg.itemData.data.actionType)) {
		if (!tactor.data.flags["midi-qol"].rageAttacked) await tactor.setFlag("midi-qol", "rageAttacked", 1);
	}
}

if (args[0].tag == "DamageBonus" && lastArg.item.data.actionType === "mwak" && lastArg.item.abilityMod === "str") {
    const damageBonus = barbarian >= 16 ? "4" : barbarian >= 9 ? "3" : barbarian >= 1 ? "2" : "0";
	const damageType = lastArg.item.data.damage.parts[0][1];
    return {damageRoll: `${damageBonus}[${damageType}]`, flavor: "Rage"};
} 

if (args[0] === "off") {
	if (tactor.data.flags["midi-qol"].rageAttacked) await tactor.unsetFlag("midi-qol", "rageAttacked");
	if (tactor.data.flags["midi-qol"].rageDamaged) await tactor.unsetFlag("midi-qol", "rageDamaged");
}