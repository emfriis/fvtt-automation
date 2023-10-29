// horrifying visage - if ((target.actor.data.data.details?.type?.value ?? target.actor.data.data.details?.race)?.toLowerCase()?.includes("undead")) continue;

// fear immune on save
// on use pre effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.macroPass === "preActiveEffects") {
    for (let t = 0; t < lastArg.hitTargets.length; t++) {
        let target = lastArg.hitTargets[t];
        const durationType = lastArg.item.data.duration.units;
        if (!target.actor || target.actor.data.data.traits.ci.value.includes("frightened") || target.actor.effects.find(e => e.data.label === `${tactor.name} Fear Immunity`)) continue;
        if (lastArg.failedSaves.includes(target)) {
            let duration = durationType === "round" ? lastArg.item.data.duration.value * 6 : durationType === "minute" ? lastArg.item.data.duration.value * 60 : durationType === "hour" ? lastArg.item.data.duration.value * 3600 : lastArg.item.data.duration.value;
            let effectData = {
                label: "Frightened",
                icon: "icons/svg/terror.svg",
                origin: lastArg.uuid,
                disabled: false,
                duration: { seconds: duration, startTime: game.time.worldTime },
                flags: { dae: { itemData: lastArg.item, macroRepeat: "endEveryTurn", }, core: { statusId: "Frightened" } },
                changes: [
                    { key: "flags.midi-qol.fear", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `+${lastArg.tokenId}`, priority: 20 },
                    { key: "macro.itemMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `${lastArg.item.data.save.dc} ${lastArg.item.data.save.ability} ${tactor.name}`, priority: 20 },
                ],
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });
        } else {
            let effectData = {
                label: `${tactor.name} Fear Immunity`,
                origin: lastArg.uuid,
                disabled: false,
                flags: { dae: { specialDuration: ["longRest"] } },
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });
        }
    }
}

if (args[0] === "each" && !lastArg.efData.disabled) {
    const spellDC = args[1];
    const ability = args[2];
    const save = await USF.socket.executeAsGM("attemptSaveDC", { actorUuid: lastArg.actorUuid, saveName: `${lastArg.efData.label} Save`, saveImg: lastArg.efData.icon, saveType: "save", saveDC: spellDC, saveAbility: ability });
    if (save) {
        let fear = tactor.effects.find(i => i.data === lastArg.efData);
		if (fear) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [fear.id] });
        let effectData = {
            label: `${args[3]} Fear Immunity`,
            origin: lastArg.efData.origin,
            disabled: false,
            flags: { dae: { specialDuration: ["longRest"] } },
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
    }
}