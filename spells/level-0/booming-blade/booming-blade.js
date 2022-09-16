// booming blade

const lastArg = args[args.length - 1];

// macro vars
const sequencerFile = "jb2a.static_electricity.01.blue";
const sequencerScale = 1.5;
const damageType = "thunder";

// sequencer caller for effects on target
function sequencerEffect(target, file, scale) {
  if (game.modules.get("sequencer")?.active && hasProperty(Sequencer.Database.entries, "jb2a")) {
    new Sequence().effect().file(file).atLocation(target).scaleToObject(scale).play();
  }
}

function weaponAttack(caster, sourceItemData, origin, target) {
  const chosenWeapon = DAE.getFlag(caster, "boomingBladeChoice");
  const filteredWeapons = caster.items.filter((i) => i.data.type === "weapon" && i.data.data.equipped);
  let weapon_content = "";

  //Filter for weapons
  filteredWeapons.forEach((weapon) => {
    weapon_content += `<label class="radio-label">
    <input type="radio" name="weapon" value="${weapon.id}">
    <img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">
    ${weapon.data.name}
    </label>`;
  });

  let content = `
    <style>
    .weapon .form-group {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-items: flex-start;
      }

      .weapon .radio-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        justify-items: center;
        flex: 1 0 25%;
        line-height: normal;
      }

      .weapon .radio-label input {
        display: none;
      }

      .weapon img {
        border: 0px;
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        cursor: pointer;
      }

      /* CHECKED STYLES */
      .weapon [type=radio]:checked + img {
        outline: 2px solid #f00;
      }
    </style>
    <form class="weapon">
      <div class="form-group" id="weapons">
          ${weapon_content}
      </div>
    </form>
  `;

  new Dialog({
    title: "Booming Blade: Choose a weapon to attack with",
    content,
    buttons: {
      Ok: {
        label: "Ok",
        callback: async (html) => {
          const characterLevel = caster.data.type === "character" ? caster.data.data.details.level : caster.data.data.details.cr;
          const cantripDice = 1 + Math.floor((characterLevel + 1) / 6);
          const itemId = $("input[type='radio'][name='weapon']:checked").val();
          const weaponItem = caster.getEmbeddedDocument("Item", itemId);
          DAE.setFlag(caster, "boomingBladeChoice", itemId);
          const weaponCopy = duplicate(weaponItem);
          delete weaponCopy._id;
          if (cantripDice > 0) {
            weaponCopy.data.damage.parts[0][0] += ` + ${cantripDice - 1}d8[${damageType}]`;
          }
          weaponCopy.name = weaponItem.name + " [Booming Blade]";
          weaponCopy.effects.push({
            changes: [{ key: "macro.itemMacro", mode: 0, value: "", priority: "20", }],
            disabled: false,
            duration: { rounds: 1 },
            icon: sourceItemData.img,
            label: sourceItemData.name,
            origin,
            transfer: false,
            flags: { targetUuid: target.uuid, casterUuid: caster.uuid, origin, cantripDice, damageType, dae: { specialDuration: ["turnStartSource", "isMoved"], transfer: false }},
          });
          setProperty(weaponCopy, "flags.itemacro", duplicate(sourceItemData.flags.itemacro));
          setProperty(weaponCopy, "flags.midi-qol.effectActivation", false);
          const attackItem = new CONFIG.Item.documentClass(weaponCopy, { parent: caster });
          const options = { showFullCard: false, createWorkflow: true, configureDialog: true };
          await MidiQOL.completeItemRoll(attackItem, options);
        },
      },
      Cancel: {
        label: "Cancel",
      },
    },
  }).render(true);
}

if(args[0].tag === "OnUse"){
  if (lastArg.targets.length > 0) {
    const casterData = await fromUuid(lastArg.actorUuid);
    const caster = casterData.actor ? casterData.actor : casterData;
    weaponAttack(caster, lastArg.itemData, lastArg.uuid, lastArg.targets[0]);
  } else {
    ui.notifications.error("Booming Blade: No target selected: please select a target and try again.");
  }

} else if (args[0] === "on") {
  const targetToken = canvas.tokens.get(lastArg.tokenId);
  sequencerEffect(targetToken, sequencerFile, sequencerScale);
} else if (args[0] === "off") {
  // uses midis move flag to determine if to apply extra damage
  if (lastArg["expiry-reason"] === "midi-qol:isMoved") {
    const targetToken = await fromUuid(lastArg.tokenUuid);
    const sourceItem = await fromUuid(lastArg.efData.flags.origin);
    const caster = sourceItem.parent;
    const casterToken = canvas.tokens.placeables.find((t) => t.actor?.uuid === caster.uuid);
    const damageRoll = await new Roll(`${lastArg.efData.flags.cantripDice}d8[${damageType}]`).evaluate({ async: true });
    if (game.dice3d) game.dice3d.showForRoll(damageRoll);
    const workflowItemData = duplicate(sourceItem.data);
    workflowItemData.data.target = { value: 1, units: "", type: "creature" };
    workflowItemData.name = "Booming Blade: Movement Damage";

    await new MidiQOL.DamageOnlyWorkflow(
      caster,
      casterToken.data,
      damageRoll.total,
      damageType,
      [targetToken],
      damageRoll,
      {
        flavor: `(${CONFIG.DND5E.damageTypes[damageType]})`,
        itemCardId: "new",
        itemData: workflowItemData,
        isCritical: false,
      }
    );
    sequencerEffect(targetToken, sequencerFile, sequencerScale);
  }
}