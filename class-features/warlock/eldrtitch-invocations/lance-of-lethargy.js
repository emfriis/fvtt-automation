// lance of lethargy
// effect on use post attack roll

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.macroPass === "postAttackRoll" && lastArg.item.name == "Eldritch Blast" && lastArg.hitTargets.length) {
    if (game.combat && tactor.data.flags["midi-qol"].lethargyTime !== `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`) return;
    const tokenOrActorTarget = await fromUuid(lastArg.hitTargetUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
    let dialog =  new Promise(async (resolve, reject) => {
        new Dialog({
            title: "Eldritch Invocations: Lance of Lethargy",
            content: `Use Lance of Lethargy to reduce target's speed?`,
            buttons: {
                Ok: {
                    label: "Ok",
                    callback: () => { resolve(true) },
                },
                Cancel: {
                    label: "Cancel",
                    callback: () => { resolve(true) },
                },
            },
            default: "Cancel",
            close: () => { resolve(false) },
        }).render(true);
    });
    let lance = await dialog;
    if (!lance) return;
    const effectData = {
        changes: [{ key: "data.attributes.movement.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "-10", priority: 20, }],
        disabled: false,
        flags: { dae: { specialDuration: ["turnStartSource"] }, core: { statusId: "Lance of Lethargy" } },
        icon: "icons/magic/unholy/energy-smoke-pink.webp",
        label: "Lance of Lethargy",
    };
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
    if (game.combat) await tactor.setFlag("midi-qol", "lethargyTime", `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`);
}