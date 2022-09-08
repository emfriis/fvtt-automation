// ##### WIP #####

// sneak attack phantom rogue
// requires MIDI-QOL

async function findTargets(originToken, range, includeOrigin = false, casterToken) {
  const aoeTargets = await canvas.tokens.placeables.filter((placeable) =>
    (includeOrigin || placeable.id !== originToken.id) &&
    ![casterToken.actor.id].includes(placeable.actor?.id) &&
    placeable.actor?.data.data.attributes.hp.value !== 0 &&
    MidiQOL.getDistance(originToken, placeable, false) <= range &&
    placeable.actor?.data.disposition !== casterToken.actor?.data.disposition
  );
  ui.notifications.warn(aoeTargets);
  return aoeTargets;
}

async function attackNearby(originToken, casterToken) {
  const potentialTargets = await findTargets(originToken, 30, false, casterToken);
  if (potentialTargets.length === 0) return;

  let target_content = "";
  potentialTargets.forEach((t) => {
    target_content += `<label class="radio-label">
    <input type="radio" name="target" value="${t.id}">
    <img src="${t.data.img}" style="border:0px; width: 100px; height:100px;">
    </label>`;
  });

  let content = `
    <style>
    .target .form-group {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-items: flex-start;
      }

      .target .radio-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        justify-items: center;
        flex: 1 0 25%;
        line-height: normal;
      }

      .target .radio-label input {
        display: none;
      }

      .target img {
        border: 0px;
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        cursor: pointer;
      }

      /* CHECKED STYLES */
      .target [type=radio]:checked + img {
        outline: 2px solid #f00;
      }
    </style>
    <form class="target">
      <div class="form-group" id="target">
          ${target_content}
      </div>
    </form>
  `;

  new Dialog({
    title: "Wails from the Grave: Choose a secondary target",
    content,
    buttons: {
      Choose: {
        label: "Choose",
        callback: async (html) => {
          const selectedId = $("input[type='radio'][name='target']:checked").val();
          const targetToken = canvas.tokens.get(selectedId);
          const rogueLevels = actor.getRollData().classes.rogue?.levels;
          const baseDice = Math.ceil(rogueLevels/4);
          const damageRoll = await new Roll(`${baseDice}d6[necrotic]`).evaluate({ async: true });
          if (game.dice3d) game.dice3d.showForRoll(damageRoll);
          const workflowItemData = duplicate(args[0].item);
          workflowItemData.data.target = { value: 2, units: "", type: "creature" };
          workflowItemData.name = "Wails from the Grave";

          await new MidiQOL.DamageOnlyWorkflow(
            caster,
            casterToken.data,
            damageRoll.total,
            necrotic,
            [originToken, targetToken],
            damageRoll,
            {
              flavor: `(${CONFIG.DND5E.damageTypes[necrotic]})`,
              itemCardId: "new",
              itemData: workflowItemData,
              isCritical: false,
            }
          );
          //sequencerEffect(targetToken); ######### implement wails animation
        },
      },
      Cancel: {
        label: "Cancel",
      },
    },
  }).render(true);
}

try {
    if (!["mwak","rwak"].includes(args[0].itemData.data.actionType)) return {}; // weapon attack
    if (args[0].itemData.data.actionType === "mwak" && !args[0].itemData.data.properties?.fin) 
      return {}; // ranged or finesse
    if (args[0].hitTargets.length < 1) return {};
    token = canvas.tokens.get(args[0].tokenId);
    actor = token.actor;
    if (!actor || !token || args[0].hitTargets.length < 1) return {};
    const rogueLevels = actor.getRollData().classes.rogue?.levels;
    if (!rogueLevels) {
      MidiQOL.warn("Sneak Attack Damage: Trying to do sneak attack and not a rogue");
      return {}; // rogue only
    }
    let target = canvas.tokens.get(args[0].hitTargets[0].id ?? args[0].hitTargers[0]._id);
    if (!target) MidiQOL.error("Sneak attack macro failed");
    
    if (game.combat) {
      const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn /100}`;
      const lastTime = actor.getFlag("midi-qol", "sneakAttackTime");
      if (combatTime === lastTime) {
       MidiQOL.warn("Sneak Attack Damage: Already done a sneak attack this turn");
       return {};
      }
    }
    let foundEnemy = true;
    let isSneak = args[0].advantage;
    
    if (!isSneak) {
      foundEnemy = false;
      let nearbyEnemy = canvas.tokens.placeables.filter(t => {
        let nearby = (t.actor &&
             t.actor?.uuid !== args[0].actorUuid && // not me
             t.id !== target.id && // not the target
             t.actor?.data.data.attributes?.hp?.value > 0 && // not dead or unconscious
			 !t.actor.effects.find(i => i.data.label === "Incapacitated") && // not incapacitated
             t.data.disposition !== target.data.disposition && // not an ally
             MidiQOL.getDistance(t, target, false) <= 5 // close to the target
         );
        foundEnemy = foundEnemy || (nearby && t.data.disposition === -target.data.disposition)
        return nearby;
      });
      isSneak = nearbyEnemy.length > 0;
    }
    if (!isSneak) {
      MidiQOL.warn("Sneak Attack Damage: No advantage/ally next to target");
      return {};
    }
    let useSneak = getProperty(actor.data, "flags.dae.autoSneak");
    if (!useSneak) {
        let dialog = new Promise((resolve, reject) => {
          new Dialog({
          // localize this text
          title: "Conditional Damage",
          content: `<p>Use Sneak attack?</p>`+(!foundEnemy ? "<p>Only Neutral creatures nearby</p>" : ""),
          buttons: {
              one: {
                  icon: '<i class="fas fa-check"></i>',
                  label: "Confirm",
                  callback: () => resolve(true)
              },
              two: {
                  icon: '<i class="fas fa-times"></i>',
                  label: "Cancel",
                  callback: () => {resolve(false)}
              }
          },
          default: "two",
		  close: callBack => {resolve(false)}
          }).render(true);
        });
        useSneak = await dialog;
    }
    if (!useSneak) return {}

    let dialog = new Promise((resolve, reject) => {
      new Dialog({
      // localize this text
      title: "Conditional Damage",
      content: `<p>Use Wails from the Grave?</p>`,
      buttons: {
          one: {
              icon: '<i class="fas fa-check"></i>',
              label: "Confirm",
              callback: () => resolve(true)
          },
          two: {
              icon: '<i class="fas fa-times"></i>',
              label: "Cancel",
              callback: () => {resolve(false)}
          }
      },
      default: "two",
      close: callBack => {resolve(false)}
      }).render(true);
    });
    useWails = await dialog;

    if (useWails) {
      await attackNearby(target, token);
    }

    const diceMult = args[0].isCritical ? 2: 1;
    const baseDice = Math.ceil(rogueLevels/2);
	  const damageType = args[0].item.data.damage.parts[0][1];
    if (game.combat) {
      const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn /100}`;
      const lastTime = actor.getFlag("midi-qol", "sneakAttackTime");
      if (combatTime !== lastTime) {
         await actor.setFlag("midi-qol", "sneakAttackTime", combatTime)
      }
    }
    return {damageRoll: `${baseDice * diceMult}d6[${damageType}]`, flavor: "Sneak Attack"};
} catch (err) {
    console.error(`${args[0].itemData.name} - Sneak Attack}`, err);
}