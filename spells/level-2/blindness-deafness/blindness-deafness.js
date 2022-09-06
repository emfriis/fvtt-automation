// blindness/deafness

if (!game.modules.get("dfreds-convenient-effects")?.active) {
    ui.notifications.error("Please enable the CE module");
    return;
  }
  
  const lastArg = args[args.length - 1];
  const token = await fromUuid(lastArg.tokenUuid);
  const tokenOrActor = await fromUuid(lastArg.actorUuid);
  const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  
  function effectAppliedAndActive(conditionName) {
    return targetActor.data.effects.some(
      (activeEffect) =>
        activeEffect?.data?.flags?.isConvenient &&
        activeEffect?.data?.label == conditionName &&
        !activeEffect?.data?.disabled
    );
  }
  
  if (args[0] === "on") {
    new Dialog({
      title: "Choose an Effect",
      buttons: {
        blind: {
          label: "Blindness",
          callback: () => {
            if (!targetActor.data.data.traits.ci.value.includes("Blinded")) {
                DAE.setFlag(targetActor, "DAEBlind", "blind");
                game.dfreds.effectInterface.addEffect({ effectName: "Blinded", uuid: targetActor.uuid });
                const changes = [
                  {
                    key: "ATCV.blinded",
                    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                    priority: 99,
                    value: "1",
                  },
                  {
                    key: "ATCV.conditionType",
                    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                    priority: 99,
                    value: "sense",
                  },
                  {
                    key: "ATCV.conditionBlinded",
                    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                    priority: 99,
                    value: "true",
                  },
                  {
                    key: "ATCV.conditionTargets",
                    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                    priority: 99,
                    value: "",
                  },
                  {
                    key: "ATCV.conditionSources",
                    mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                    priority: 99,
                    value: "",
                  },
                ];
                const effect = targetActor.effects.find((e) => e.data.label === lastArg.efData.label);
                effect.update({ changes: changes.concat(effect.data.changes) });
                const senses = targetActor.data.data.attributes.senses;
                let visionRange = Math.max(senses.blindsight, senses.tremorsense, 0);
                token.setFlag('perfect-vision', 'sightLimit', visionRange);
            }
          },
        },
        deaf: {
          label: "Deafness",
          callback: () => {
            DAE.setFlag(targetActor, "DAEBlind", "deaf");
            game.dfreds.effectInterface.addEffect({ effectName: "Deafened", uuid: targetActor.uuid });
          },
        },
      },
    }).render(true);
  }
  
  if (args[0] === "off") {
    let flag = DAE.getFlag(targetActor, "DAEBlind");
    if (flag === "blind") {
      if (effectAppliedAndActive("Blinded", targetActor))
        game.dfreds.effectInterface.removeEffect({ effectName: "Blinded", uuid: targetActor.uuid });
        token.setFlag('perfect-vision', 'sightLimit', null);
    } else if (flag === "deaf") {
      if (effectAppliedAndActive("Deafened", targetActor))
        game.dfreds.effectInterface.removeEffect({ effectName: "Deafened", uuid: targetActor.uuid });
    }
    DAE.unsetFlag(targetActor, "DAEBlind");
  }