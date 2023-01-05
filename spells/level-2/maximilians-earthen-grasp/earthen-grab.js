// earthen grasp - earthen grab
// on use post effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse") {
    const tokenTarget = lastArg.targets[0];
    const tactorTarget = tokenTarget?.actor;
    const grasp = tactor.effects.find(e => e.data.label === "Grasp");
    if (grasp) await tactor.deleteEmbeddedDocuments("ActiveEffect", [grasp.id]);
    const restrained = tactorTarget.effects.find(e => e.data.label === "Restrained" && e.data.origin === lastArg.uuid);
    let effectData = [{
        changes: [
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: restrained.uuid, priority: 20 }
        ],
        disabled: false,
        icon: lastArg.item.img,
        label: "Grasp"
    }];
    if (restrained) await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: effectData });
}