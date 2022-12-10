const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const content = `
<style>
  .protEnergy .form-group {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    align-items: flex-start;
  }
  .protEnergy .radio-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    justify-items: center;
    flex: 1 0 20%;
    line-height: normal;
  }
  .protEnergy .radio-label input {
    display: none;
  }
  .protEnergy img {
    border: 0px;
    width: 50px;
    height: 50px;
    flex: 0 0 50px;
    cursor: pointer;
  }
  /* CHECKED STYLES */
  .protEnergy [type="radio"]:checked + img {
    outline: 2px solid #f00;
  }
</style>
<form class="protEnergy">
  <div class="form-group" id="types">
    <label class="radio-label">
      <input type="radio" name="type" value="acid" />
      <img
        src="icons/magic/acid/dissolve-bone-white.webp"
        style="border: 0px; width: 50px; height: 50px"
      />
      Acid
    </label>
    <label class="radio-label">
      <input type="radio" name="type" value="cold" />
      <img
        src="icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp"
        style="border: 0px; width: 50px; height: 50px"
      />
      Cold
    </label>
    <label class="radio-label">
      <input type="radio" name="type" value="fire" />
      <img
        src="icons/magic/fire/barrier-wall-flame-ring-yellow.webp"
        style="border: 0px; width: 50px; height: 50px"
      />
      Fire
    </label>
    <label class="radio-label">
      <input type="radio" name="type" value="lightning" />
      <img
        src="icons/magic/lightning/bolt-strike-blue.webp"
        style="border: 0px; width: 50px; height: 50px"
      />
      Lighting
    </label>
    <label class="radio-label">
      <input type="radio" name="type" value="thunder" />
      <img
        src="icons/magic/sonic/explosion-shock-wave-teal.webp"
        style="border: 0px; width: 50px; height: 50px"
      />
      Thunder
    </label>
  </div>
</form>
`;

if (args[0].tag === "OnUse") {
  const tokenOrActorTarget = await fromUuid(lastArg.targetUuids[0]);
  const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
  const gameRound = game.combat ? game.combat.round : 0;
  const durationType = lastArg.item.data.duration.units;
  const duration = durationType === "second" ? lastArg.item.data.duration.value * 6 : durationType === "minute" ? lastArg.item.data.duration.value * 10 : durationType === "hour" ? lastArg.item.data.duration.value * 600 : lastArg.item.data.duration.value;
  
  await new Dialog({
    title: 'Choose a Damage Type:',
    content: content,
    buttons: {
      yes: {
        icon: '<i class="fas fa-check"></i>',
        label: 'Protect',
        callback: async (html) => {
          const element = $("input[type='radio'][name='type']:checked").val();
          const effectData = {
            changes: [
                {
                  key: "data.traits.dr.value",
                  mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                  priority: 30,
                  value: element,
                }
            ],
            disabled: false,
            icon: lastArg.item.img,
            label: `${lastArg.item.name}: ${element.charAt(0).toUpperCase() + element.slice(1)} Resistance`,
            duration: { rounds: duration, startRound: gameRound, startTime: game.time.worldTime },
          };
          await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
          let conc = tactor.effects.find(i => i.data.label === "Concentrating");
          if (conc) {
            let concUpdate = await getProperty(tactor.data.flags, "midi-qol.concentration-data.targets");
            await concUpdate.push({ tokenUuid: tokenOrActorTarget.uuid, actorUuid: tactorTarget.uuid });
            await tactor.setFlag("midi-qol", "concentration-data.targets", concUpdate);
          }
        }
      },
    },
  }).render(true, {width: 400});
}