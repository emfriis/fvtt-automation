// two weapon fighting
// on use

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse") {
  const twoFS = tactor.items.find(i => i.name.toLowerCase().includes("fighting style: two-weapon fighting")); // search for two-weapon fighting style
  const twoFeat = tactor.items.find(i => i.name.toLowerCase().includes("dual wielder")); // search for dual wielder feat
  const filteredWeapons = tactor.items.filter((i) => i.data.data.equipped && (i.data.data.properties?.lgt || twoFeat) && !i.data.data.properties?.two);

  //Filter for weapons
  let weapon_content = "";

  filteredWeapons.forEach((weapon) => {
    weapon_content += `<label class="radio-label">
    <input type="radio" name="weapon" value="${weapon.id}">
    <img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">
    ${weapon.data.name}
    </label>`;
  });

  let content = `
    <style>
    .twoWeapon .form-group {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-items: flex-start;
      }

      .twoWeapon .radio-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        justify-items: center;
        flex: 1 0 25%;
        line-height: normal;
      }

      .twoWeapon .radio-label input {
        display: none;
      }

      .twoWeapon img {
        border: 0px;
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        cursor: pointer;
      }

      /* CHECKED STYLES */
      .twoWeapon [type=radio]:checked + img {
        outline: 2px solid #f00;
      }
    </style>
    <form class="twoWeapon">
      <div class="form-group" id="weapons">
          ${weapon_content}
      </div>
    </form>
  `;

  new Dialog({
    title: "Two Weapon Fighting: Choose a weapon to attack with",
    content,
    buttons: {
      Ok: {
        label: "Ok",
        callback: async () => {
          const itemId = $("input[type='radio'][name='weapon']:checked").val();
          const weaponItem = tactor.getEmbeddedDocument("Item", itemId);
          const weaponCopy = duplicate(weaponItem);
          delete weaponCopy._id;
          if (!twoFS) weaponCopy.data.damage.parts[0][0] = weaponCopy.data.damage.parts[0][0].replace("@mod", "0");
          weaponCopy.name = weaponItem.name + " (Two Weapon Fighting)";
          const attackItem = new CONFIG.Item.documentClass(weaponCopy, { parent: tactor });
          const options = { showFullCard: false, createWorkflow: true, configureDialog: true, targets: lastArg.targetUuids ? [lastArg.targetUuids[0]] : [] };
          await MidiQOL.completeItemRoll(attackItem, options);
        },
      },
      Cancel: {
        label: "Cancel",
      },
    },
  }).render(true);
}