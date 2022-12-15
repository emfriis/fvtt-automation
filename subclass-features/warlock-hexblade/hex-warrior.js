// hex warrior
// on use

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const DAEItem = lastArg.efData.flags.dae.itemData;

/**
 * Select for weapon
 */
if (args[0] === "on") {
  const weapons = targetActor.items.filter((i) => i.data.type === "weapon" && i.data.data.properties.two !== true);
  let weapon_content = "";

  //Filter for weapons
  weapons.forEach((weapon) => {
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
    content,
    buttons: {
      ok: {
        label: `Ok`,
        callback: (html) => {
          const itemId = $("input[type='radio'][name='weapon']:checked").val();
          const weaponItem = targetActor.items.get(itemId);
          let copyItem = duplicate(weaponItem);
          DAE.setFlag(targetActor, "hexWeapon", {
            weapon: itemId,
			      ability: copyItem.data.ability,
			      name: copyItem.name,
          });
          if (copyItem.data.attackBonus === "") copyItem.data.attackBonus = "0";
          copyItem.data.ability = "cha";
		  copyItem.name = "Hex " + copyItem.name;
          targetActor.updateEmbeddedDocuments("Item", [copyItem]);
        },
      },
      cancel: {
        label: `Cancel`,
      },
    },
  }).render(true);
}

//Revert weapon and unset flag.
if (args[0] === "off") {
try {
    const { weapon, ability, name } = DAE.getFlag(targetActor, "hexWeapon");
    const weaponItem = targetActor.items.get(weapon);
    let copyItem = duplicate(weaponItem);
    copyItem.data.ability = ability;
    copyItem.name = copyItem.name.replace("Hex ", "");
    targetActor.updateEmbeddedDocuments("Item", [copyItem]);
    DAE.unsetFlag(targetActor, "hexWeapon");
  } catch (err) {
    console.error('hex warrior macro error');
  }
}