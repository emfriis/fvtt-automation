// arcane ward
// effect on use post effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.macroPass === "postActiveEffects" && lastArg.item.data.school === "abj" && lastArg.spellLevel > 0) {
	let item = tactor.items.find(i => i.name === "Arcane Ward");
    if (!item || !item.data.data.uses.max) return;
    await item.update({ "data.uses.value": Math.min(item.data.data.uses.max, item.data.data.uses.value + lastArg.spellLevel) });
}