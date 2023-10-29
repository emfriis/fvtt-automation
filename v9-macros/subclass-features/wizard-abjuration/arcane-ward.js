// arcane ward
// effect on use post effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.macroPass === "postActiveEffects" && lastArg.item.type === "spell" && lastArg.item.data.school === "abj" && lastArg.spellLevel > 0) {
	let item = tactor.items.find(i => i.name === "Arcane Ward");
    if (!item) return;
    if (!tactor.effects.find(e => e.data.label === "Arcane Ward Barrier")) {
        const effectData = {
            changes: [{ key: `flags.midi-qol.arcaneWard`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
            disabled: false,
            label: "Arcane Ward Barrier",
            icon: "icons/magic/defensive/shield-barrier-glowing-triangle-blue-yellow.webp",
            flags: { dae: { itemData: item.data, stackable: "noneName", specialDuration: ["longRest"] } },
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
    } else {
        if (!item || !item.data.data.uses.max) return;
        await item.update({ "data.uses.value": Math.min(item.data.data.uses.max, item.data.data.uses.value + lastArg.spellLevel) });
    }
}