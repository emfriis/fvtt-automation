// requires an item folder named Weapons with all applicable SRD weapons

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const DAEItem = lastArg.efData.flags.dae.itemData;

let hexWarrior = targetActor.items.find(i => i.name === "Hex Warrior");
let improved = targetActor.items.find(i => i.name === "Eldritch Invocations: Improved Pact Weapon");

function valueLimit(val, min, max) {
  return val < min ? min : val > max ? max : val;
}

/**
 * Select for weapon
 */
if (args[0] === "on") {
  const folderName = "Weapons";
  const getFolder = game.folders.getName(folderName).content;
  let weapons;
  if (!improved) {
    weapons = getFolder.filter((i) => i.data.type === "weapon" && i.data.data.actionType === "mwak");
  } else if (improved) {
    weapons = getFolder.filter((i) => i.data.type === "weapon");
  }
  const weaponContents = weapons.reduce((acc, target) => acc += `<option value="${target.id}">${target.name}</option>`
    , ``);
  const content = `<p>Pick a weapon</p><form><div class="form-group"><label for="weapon">Weapon:</label><select id="weapon">${weaponContents}</select></div></form>`;

  new Dialog({
    content,
    buttons: {
      ok: {
        label: `Ok`,
        callback: (html) => {
          let itemId = html.find('#weapon')[0].value;
		  let weaponItem = getFolder.find(i => i.id === itemId);
          let copyItem = duplicate(weaponItem);
          DAE.setFlag(targetActor, "pactWeapon", {
			name: "Pact "+copyItem.name,
          });
          if (copyItem.data.attackBonus === "") copyItem.data.attackBonus = "0";
		  if (copyItem.data.attackBonus === "0" && improved) {
			copyItem.data.attackBonus += 1;
			copyItem.data.damage.parts[0][0] += " + 1"
			if (copyItem.data.damage.versatile !== "" && copyItem.data.damage.versatile !== null) copyItem.data.damage.versatile += " + 1";
		  }
          if (hexWarrior) copyItem.data.ability = "cha";
		  copyItem.name = "Pact " + copyItem.name;
		  copyItem.data.equipped = true;
		  copyItem.data.properties.proficient = true;
          targetActor.createEmbeddedDocuments("Item", [copyItem]);
        },
      },
      cancel: {
        label: `Cancel`,
      },
    },
  }).render(true);
}

//Delete weapon and unset flag.
if (args[0] === "off") {
  const { name } = DAE.getFlag(targetActor, "pactWeapon");
  let weapon = targetActor.items.find(i => i.name === name);
  targetActor.deleteEmbeddedDocuments("Item", [weapon._id ?? weapon.id]);
}