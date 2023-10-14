const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
//create effects and reapply item
if (lastArg.tag === "OnUse" && lastArg.macroPass === "postActiveEffects") {
    const item = actor.items.find(i => i.name === "Hunter's Mark" && i.type === "spell");
    const effect = actor.effects.find(e => e.label == "Hunter's Mark Damage Bonus");
    const isReapply = lastArg.item.name !== "Hunter's Mark";
    const conc = actor.effects.find(e => e.label === "Concentrating");
    const target = lastArg.targets[0]?.actor;
    if(!target) return;
    if (isReapply) {
        const prevTarget = canvas.tokens.get(actor.flags["midi-qol"]?.huntersMarkTarget);
        if (prevTarget && prevTarget.actor.system.attributes.hp.value > 0) {
            return ui.notifications.warn("Previous target still above 0 hit points");
        } else if (prevTarget && prevTarget.actor.system.attributes.hp.value < 1) {
            await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: prevTarget.actor.uuid, effects: [prevTarget.actor.effects.find(e => e.label === "Hunter's Mark" && e.origin === item.uuid)?.id] });
        }
    } else {
        const duration = lastArg.spellLevel > 4 ? 86400 : lastArg.spellLevel > 2 ? 28800 : 3600;
        if (effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: effect.id, duration: { seconds: duration } }] });
        if (conc) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, duration: { seconds: duration } }] });
        const itemData = mergeObject(duplicate(item), {
            name: "Reapply Hunter's Mark",
            type: "feat",
            effects: [],
            system: { duration: { value: null, units: null}, components: {concentration: false, material: false, ritual: false, somatic: false, value: "", vocal: false} }
        }, {overwrite: true, inlace: true, insertKeys: true, insertValues: true});
        await actor.createEmbeddedDocuments("Item", [itemData]);
        const reapplyItem = actor.items.find(i => i.name === "Reapply Hunter's Mark");
        if (reapplyItem && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: effect.id, changes: effect.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: reapplyItem.uuid, priority: 20 }]) }] });
    }
    //create target effect
    const effectData = {
        label: item.name,
        icon: item.img,
        changes: [{ key: "flags.midi-qol.huntersMark", mode: 2, value: lastArg.tokenId, priority: 20 }],
        origin: item.uuid,
        disabled: false,
        flags: { dae: { showIcon: true } },
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.uuid, effects: [effectData] });
    //update self effect
    const targetEffect =  target.effects.find(e => e.label === "Hunter's Mark" && e.changes.find(c => c.key == "flags.midi-qol.huntersMark" && c.value == lastArg.tokenId));
    if (effect && targetEffect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: effect.id, changes: effect.changes.filter(c => c.key != "flags.midi-qol.huntersMarkTarget").concat([{ key: "flags.midi-qol.huntersMarkTarget", mode: 2, value: lastArg.targets[0].id, priority: 20 }, { key: `flags.dae.deleteUuid`, mode: 5, value: targetEffect.uuid, priority: 20 }]) }] });
}
//apply damage bonus
if (lastArg.tag === "DamageBonus" && lastArg.damageRoll && ["mwak","rwak"].includes(lastArg.item.system.actionType) && lastArg.targets.find(t => t.actor.flags["midi-qol"]?.huntersMark?.includes(lastArg.tokenId))) {
    const diceMult = lastArg.isCritical ? 2 : 1;
    return { damageRoll: `${diceMult}d6`, flavor: "Hunter's Mark" }
}
//remove reapply item
if (args[0] === "off" && lastArg.efData.label === "Hunter's Mark Damage Bonus") {
    const removeItem = actor.items.find(i => i.name === "Reapply Hunter's Mark");
    if (removeItem) await actor.deleteEmbeddedDocuments("Item", [removeItem.id]);
}