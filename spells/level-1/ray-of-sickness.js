const lastArg = args[args.length - 1];

if (args[0].tag === "OnUse" && lastArg.hitTargetUuids.length > 0) {
    const resist = ["Dwarven Resilience", "Duergar Resilience", "Stout Resilience", "Poison Resilience"];
    for (let i = 0; i < lastArg.hitTargetUuids.length; i++) {
        let tokenOrActorTarget = await fromUuid(lastArg.hitTargetUuids[i]);
        let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
        let getResist = tactorTarget.items.find(i => resist.includes(i.name)) || tactorTarget.effects.find(i => resist.includes(i.data.label));
        if (getResist) {
            const effectData = {
                changes: [
                    {
                        key: "flags.midi-qol.advantage.ability.save.all",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        value: 1,
                        priority: 20,
                    }
                ],
                disabled: false,
                flags: { dae: { specialDuration: ["isSave"] } },
                icon: args[0].item.img,
                label: `${args[0].item.name} Save Advantage`,
            };
            await tactorTarget.createEmbeddedDocuments("ActiveEffect", [effectData]);
        }
    }
}