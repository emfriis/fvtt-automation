// polearm master
// on use

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse") {
  const filteredWeapons = tactor.items.filter((i) => i.type === "weapon" && i.data.data.equipped && (["glaive","halberd","pike","quarterstaff","spear"].includes(i.data.data.baseItem) || ["glaive","halberd","pike","quarterstaff","spear"].find(w => i.name.toLowerCase().includes(w))));

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
    .polearmWeapon .form-group {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-items: flex-start;
      }

      .polearmWeapon .radio-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        justify-items: center;
        flex: 1 0 25%;
        line-height: normal;
      }

      .polearmWeapon .radio-label input {
        display: none;
      }

      .polearmWeapon img {
        border: 0px;
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        cursor: pointer;
      }

      /* CHECKED STYLES */
      .polearmWeapon [type=radio]:checked + img {
        outline: 2px solid #f00;
      }
    </style>
    <form class="polearmWeapon">
      <div class="form-group" id="weapons">
          ${weapon_content}
      </div>
    </form>
  `;

  new Dialog({
    title: "Polearm Master: Choose a weapon to attack with",
    content,
    buttons: {
      Ok: {
        label: "Ok",
        callback: async () => {
          const itemId = $("input[type='radio'][name='weapon']:checked").val();
          const weaponItem = tactor.getEmbeddedDocument("Item", itemId);
          const weaponCopy = duplicate(weaponItem);
          delete weaponCopy._id;
          weaponCopy.data.damage.parts[0][0] = weaponCopy.data.damage.parts[0][0].replace(/d\d{1,2}/, "d4");
          weaponCopy.name = weaponItem.name + " (Polearm Master)";
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