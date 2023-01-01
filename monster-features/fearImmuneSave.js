// fear immune on save
// on use pre effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.macroPass === "preActiveEffects") {
    for (let t = 0; t < lastArg.hitTargets.length; t++) {
        let target = lastArg.hitTargets[t];
        if (!target.actor || target.actor.data.data.traits.ci.value.includes("frightened") || target.actor.effects.find(e => e.data.label === `${tactor.name} Fear Immunity` && e.data.origin === lastArg.uuid)) continue;
        if (lastArg.failedSaves.includes(target)) {
            let effectData = {
                label: "Frightened",
                origin: lastArg.uuid,
                disabled: false,
                flags: { dae: { itemData: lastArg.item, macroRepeat: "endEachTurn", specialDuration: ["turnStart"] } },
                changes: [{ key: "flags.midi-qol.fear", mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: lastArg.tokenId, priority: 20 }],
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
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
    if (canSee(token, sourceToken)) return;
    const spellDC = args[1];
    const ability = "wis";
    const save = await USF.socket.executeAsGM("attemptSaveDC", { actorUuid: lastArg.actorUuid, saveName: `${lastArg.efData.label} Save`, saveImg: lastArg.efData.icon, saveType: "save", saveDC: spellDC, saveAbility: ability });
    if (save) {
        let fear = tactor.effects.find(i => i.data === lastArg.efData);
		if (fear) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [fear.id] });
        let item = await fromUuid(lastArg.efData.origin);
        let effectData = {
            label: `${item.parent.name} Fear Immunity`,
            origin: item.uuid,
            disabled: false,
            flags: { dae: { specialDuration: ["longRest"] } },
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });
    }
}