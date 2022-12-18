// favored foe
// damage bonus

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

try {
    if (args[0].tag !== "DamageBonus" || !["mwak","rwak"].includes(args[0].item.data.actionType) || lastArg.hitTargetUuids.length === 0) return;
    const tokenOrActorTarget = await fromUuid(lastArg.hitTargetUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
    if (!tactorTarget.data.flags["midi-qol"].favoredFoe?.includes(lastArg.tokenId)) {
        const item = tactor.items.find(i => i.name === "Favored Foe");
        if (!item || !item.data.data.uses.value) return;
        let dialog = new Promise((resolve, reject) => {
            new Dialog({
                title: "Favored Foe: Mark the Target?",
                buttons: {
                    Ok: {
                        label: "Mark",
                        callback: () => {resolve(true)},
                    },
                    Cancel: {
                        label: "Cancel",
                        callback: () => {resolve(false)},
                    },
                },
                default: "Cancel",
                close: () => {resolve(false)}
            }).render(true);
        });
        mark = await dialog;
        if (!mark) return;
        const gameRound = game.combat ? game.combat.round : 0;
        if (tactor.effects.find(e => e.data.label === "Concentrating")) await game.dfreds.effectInterface.removeEffect({ effectName: "Concentrating", uuid: tactor.uuid });
        await game.dfreds.effectInterface.addEffect({ effectName: "Concentrating", uuid: tactor.uuid });
        const effectData = {
            label: "Favored Foe Mark",
            icon: "icons/magic/perception/eye-ringed-glow-angry-small-red.webp",
            changes: [
                { key: `flags.midi-qol.favoredFoe`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: lastArg.tokenId, priority: 20 },
            ],
            origin: item.uuid,
            disabled: false,
            duration: { rounds: 10, startRound: gameRound, startTime: game.time.worldTime },
            flags: { "dae": { itemData: item.data, token: tactorTarget.uuid, } },
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
        const effect = tactorTarget.effects.find(e => e.data.label === "Favored Foe Mark" && e.data.origin === item.uuid);
        const conc = tactor.effects.find(e => e.data.label === "Concentrating");
        if (effect && conc) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: conc.id, changes: [{ key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: effect.uuid, priority: 20, }].concat(conc.data.changes) }] });
        item.update({"data.uses.value" : item.data.data.uses.value - 1});
        const actorData = tactor.getRollData();
        const classLevel = actorData.classes.ranger.levels;
        const damageType = lastArg.item.data.damage.parts[0][1];
        const diceMult = lastArg.isCritical ? 2 : 1;
        const dieFace = classLevel >= 14 ? 8 : classLevel >= 6 ? 6 : 4;
        if (game.combat) await tactor.setFlag("midi-qol", "foeTime", `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`);
        return { damageRoll: `${diceMult}d${dieFace}[${damageType}]`, flavor: "Favored Foe" };
    } else if (!game.combat || tactor.data.flags["midi-qol"].foeTime !== `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`) {
        const actorData = tactor.getRollData();
        const classLevel = actorData.classes.ranger.levels;
        const damageType = lastArg.item.data.damage.parts[0][1];
        const diceMult = lastArg.isCritical ? 2 : 1;
        const dieFace = classLevel >= 14 ? 8 : classLevel >= 6 ? 6 : 4;
        if (game.combat) await tactor.setFlag("midi-qol", "foeTime", `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`);
        return { damageRoll: `${diceMult}d${dieFace}[${damageType}]`, flavor: "Favored Foe" };
    }
} catch (err) {
    console.error("Favored Foe error", err);
}