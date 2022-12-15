// ambusher
// effect on use pre attack

const lastArg = args[args.length - 1];
let tokenOrActor = await fromUuid(lastArg.actorUuid);
let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0 && args[0].macroPass === "preAttackRoll" && ["mwak","rwak","msak","rsak"].includes(args[0].itemData.data.actionType)) {
    const target = await fromUuid(lastArg.targetUuids[0]);
    const tactorTarget = target.actor ? target.actor : target;
    let surprised = tactorTarget.effects.find(i => ["Surprised"].includes(i.data.label));
    if (surprised) {
        const effectData = {
            changes: [
                {
                    key: "flags.midi-qol.advantage.attack.all",
                    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                    value: 1,
                    priority: 20,
                }
            ],
            disabled: false,
            flags: { dae: { specialDuration: ["1Attack"] } },
            icon: args[0].item.img,
            label: `${args[0].item.name} Advantage`,
        };
        await tactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    }
}