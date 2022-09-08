// hypnotic pattern

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const target = await fromUuid(lastArg.actorUuid);
const targetActor = target.actor ? target.actor : target;

function effectAppliedAndActive(conditionName) {
    return targetActor.data.effects.some(
      (activeEffect) =>
        activeEffect?.data?.flags?.isConvenient &&
        activeEffect?.data?.label == conditionName &&
        !activeEffect?.data?.disabled
    );
}

if (args[0] === "on" && effectAppliedAndActive("Charmed")) {
    wait(500);
    let effect = await targetActor.effects.find(i => i.data.label === "Charmed");
    if (effect) {
        await game.dfreds.effectInterface.addEffect({ effectName: "Incapacitated", uuid: targetActor.uuid });
        let effect2 = await targetActor.effects.find(i => i.data.label === "Incapacitated");
        effect.update({ changes: [{ key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: effect2.uuid, priority: 20 }].concat(effect.data.changes) });
    }
}