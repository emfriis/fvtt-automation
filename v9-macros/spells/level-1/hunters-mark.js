// hunters mark
// on use post effects
// damage bonus
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

// create effects and reapply item
if (args[0].tag === "OnUse" && lastArg.macroPass === "postActiveEffects") {
    const item = tactor.items.find(i => i.name === "Hunter's Mark" && i.type === "spell");
    const isReapply = lastArg.item.name !== "Hunter's Mark";
    const conc = tactor.effects.find(e => e.data.label === "Concentrating");

    const tokenOrActorTarget = await fromUuid(lastArg.hitTargetUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;

    let ability;
    if (isReapply) {
        // check previous target
        const prevTarget = canvas.tokens.get(tactor.data.flags["midi-qol"]?.huntersMarkTarget);
        const prevTactor = prevTarget?.actor;
        if (prevTactor && prevTactor.data.data.attributes.hp.value !== 0) {
            ui.notifications.warn("Previous target still above 0 hit points");
            return;
        } else if (prevTactor) {
          await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: prevTactor.uuid, effects: [prevTactor.effects.find(e => e.data.label === "Hunter's Mark" && e.data.origin === item.uuid)?.id] });
      }
    } else {
        const durationSeconds = lastArg.itemLevel > 4 ? 86400 : lastArg.itemLevel > 2 ? 28800 : 3600;

        // create self effect and update concentration
        let effectData1 = {
            label: "Hunter's Mark Damage Bonus",
            icon: item.img,
            origin: item.uuid,
            disabled: false,
            flags: { dae: { itemData: item.data, token: tactorTarget.uuid, } },
            duration: { seconds: durationSeconds, startTime: game.time.worldTime },
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData1] });
        if (conc) {
            let concUpdate = await getProperty(tactor.data.flags, "midi-qol.concentration-data.targets");
            await concUpdate.push({ tokenUuid: tokenOrActor.uuid, actorUuid: tactor.uuid });
            await tactor.setFlag("midi-qol", "concentration-data.targets", concUpdate);
            await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: conc.id, duration: { seconds: durationSeconds, startTime: game.time.worldTime } }] });
        }

        // create reapply item
        const itemData = mergeObject(duplicate(item.data), {
            name: "Reapply Hunter's Mark",
            type: "feat",
            data: {
                components: {concentration: false, material: false, ritual: false, somatic: false, value: "", vocal: false},
            }
        }, {overwrite: true, inlace: true, insertKeys: true, insertValues: true});
        await tactor.createEmbeddedDocuments("Item", [itemData]);
    }

    // create target effect
    let effectData2 = {
        label: item.name,
        icon: item.img,
        changes: [
            { key: `flags.midi-qol.huntersMark`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: lastArg.tokenId, priority: 20 },
        ],
        origin: item.uuid,
        disabled: false,
        flags: { dae: { itemData: item.data, token: tactorTarget.uuid, } , core: { statusId: item.name }},
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData2] });

    // update self effect
    const sourceEffect = tactor.effects.find(e => e.data.label === "Hunter's Mark Damage Bonus" && e.data.origin === item.uuid);
    const targetEffect = tactorTarget.effects.find(e => e.data.label === "Hunter's Mark" && e.data.origin === item.uuid);
    if (sourceEffect && targetEffect) {
        const changes = [
            { key: `flags.dnd5e.DamageBonusMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.Hunter's Mark`, priority: 20 },
            { key: `flags.midi-qol.huntersMarkTarget`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.targets[0].id, priority: 20 },
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: targetEffect.uuid, priority: 20 },
            { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "", priority: 20 },
        ];
        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: sourceEffect.id, changes: changes }] });
    }
}

// mark damage bonus
if (args[0].tag === "DamageBonus" && ["mwak","rwak"].includes(lastArg.item.data.actionType) && lastArg.targets.find(t => t.actor.data.flags["midi-qol"]?.huntersMark?.includes(lastArg.tokenId))) {
    const diceMult = lastArg.isCritical ? 2 : 1;
    const damageType = lastArg.item.data.damage.parts[0][1];
    return { damageRoll: `${diceMult}d6[${damageType}]`, flavor: "Hunter's Mark" }
}

// remove reapply item
if (args[0] === "off" && lastArg.efData.label === "Hunter's Mark Damage Bonus") {
    const removeItem = tactor.items.find(i => i.name === "Reapply Hunter's Mark");
    if (removeItem) await tactor.deleteEmbeddedDocuments("Item", [removeItem.id]);
}