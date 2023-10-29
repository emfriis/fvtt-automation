const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0 && args[0].macroPass === "preSave") {
    for (let i = 0; i < lastArg.targetUuids.length; i++) {
        let tokenOrActorTarget = await fromUuid(lastArg.targetUuids[i]);
        let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
        let tokenTarget = lastArg.targets[i];
        if (token?.data?.disposition === tokenTarget?.data?.disposition) {
            const effectData = {
                changes: [
                    {
                        key: "data.bonuses.abilities.save",
                        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                        value: -999,
                        priority: 20,
                    }
                ],
                disabled: false,
                flags: { dae: { specialDuration: ["isSave"] } },
                icon: args[0].item.img,
                label: `${args[0].item.name} Save Auto Fail`,
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
        }
    }
}