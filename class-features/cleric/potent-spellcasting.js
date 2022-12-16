// potent spellcasting cleric

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;

if (args[0].item.type == "spell" && args[0].spellLevel == 0) {
	let clericCantrips = ["Sacred Flame", "Toll the Dead", "Word of Radiance"];
	if (!clericCantrips.includes(args[0].item.name)) return;
    let mod = tactor.data.data.abilities.wis.mod;
    let damageType = args[0].item.data.damage.parts[0][1];
    return {damageRoll: `${mod}[${damageType}]`, flavor: "Potent Spellcasting"};
}