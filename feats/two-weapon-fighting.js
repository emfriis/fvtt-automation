// two weapon fighting
// on use

const lastArg = args[args.length - 1];

function weaponAttack(caster, sourceItemData, origin, target) {
  const twoFS = caster.items.find(i => i.name.toLowerCase().includes("fighting style: two-weapon fighting")); // search for two-weapon fighting style
  const twoFeat = caster.items.find(i => i.name.toLowerCase().includes("dual wielder")); // search for dual wielder feat
  const filteredWeapons = caster.items.filter((i) => i.data.data.equipped && (i.data.data.properties?.lgt || twoFeat) && !i.data.data.properties?.two);
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
    .hexWeapon .form-group {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-items: flex-start;
      }

      .hexWeapon .radio-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        justify-items: center;
        flex: 1 0 25%;
        line-height: normal;
      }

      .hexWeapon .radio-label input {
        display: none;
      }

      .hexWeapon img {
        border: 0px;
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        cursor: pointer;
      }

      /* CHECKED STYLES */
      .hexWeapon [type=radio]:checked + img {
        outline: 2px solid #f00;
      }
    </style>
    <form class="hexWeapon">
      <div class="form-group" id="weapons">
          ${weapon_content}
      </div>
    </form>
  `;

  new Dialog({
    title: "Two-Weapon Fighting: Choose a weapon to attack with",
    content,
    buttons: {
      Ok: {
        label: "Ok",
        callback: async (html) => {
          const itemId = $("input[type='radio'][name='weapon']:checked").val();
          const weaponItem = caster.getEmbeddedDocument("Item", itemId);
          DAE.setFlag(caster, "bonusAttackChoice", itemId);
          const weaponCopy = duplicate(weaponItem);
          delete weaponCopy._id;
          if (!twoFS) weaponCopy.data.damage.parts[0][0] += ` -@mod`;
          weaponCopy.name = weaponItem.name + " (Two-Weapon Fighting)";
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
    ui.notifications.error("Two Weapon Fighting: No target selected: please select a target and try again.");
  }

}