// hypnotic pattern

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const target = await fromUuid(lastArg.actorUuid);
const targetActor = target.actor ? target.actor : target;

function effectAppliedAndActive() {
    return targetActor.data.effects.some(
      (activeEffect) =>
        activeEffect?.data == lastArg.efData &&
        !activeEffect?.data?.disabled
    );
}

if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0) {
    const resist = ["Fey Ancestry", "Duergar Reslience", "Charm Resilience"];
    for (let i = 0; i < lastArg.targetUuids.length; i++) {
        let tokenOrActorTarget = await fromUuid(lastArg.targetUuids[i]);
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

if (args[0] === "on" && effectAppliedAndActive()) {
    wait(500);
    let effect = await targetActor.effects.find(i => i.data.label === "Charmed");
    if (effect) {
        await game.dfreds.effectInterface.addEffect({ effectName: "Incapacitated", uuid: targetActor.uuid });
        let effect2 = await targetActor.effects.find(i => i.data.label === "Incapacitated");
        effect.update({ changes: [{ key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: effect2.uuid, priority: 20 }].concat(effect.data.changes) });
    }
}