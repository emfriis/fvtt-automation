// pact of the blade
// effect itemacro
// requires an item folder named Weapons with all applicable SRD weapons

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

let hexWarrior = tactor.items.find(i => i.name === "Hex Warrior");
let improved = tactor.items.find(i => i.name === "Invocation: Improved Pact Weapon");

if (args[0] === "on") {
  const folderName = "Weapons";
  const getFolder = game.folders.getName(folderName).content;
  let weapons;
  if (!improved) {
    weapons = getFolder.filter((i) => i.data.type === "weapon" && i.data.data.actionType === "mwak");
  } else if (improved) {
    weapons = getFolder.filter((i) => i.data.type === "weapon");
  }
  const weaponContents = weapons.reduce((acc, target) => acc += `<option value="${target.id ?? target._id}">${target.name}</option>`, ``);
  const content = `<p>Pick a weapon</p><form><div class="form-group"><label for="weapon">Weapon:</label><select id="weapon">${weaponContents}</select></div></form>`;

  new Dialog({
    content,
    buttons: {
      ok: {
        label: `Ok`,
        callback: () => {
          let itemId = $('#weapon')[0].value;
          let weaponItem = getFolder.find(i => i.id === itemId || i._id === itemId);
          let copyItem = duplicate(weaponItem.data);
          if (improved) {
            copyItem.data.attackBonus = 1;
            copyItem.data.damage.parts[0][0] += " + 1"
            if (copyItem.data.damage.versatile !== "" && copyItem.data.damage.versatile !== null) copyItem.data.damage.versatile += " + 1";
          }
          if (hexWarrior) copyItem.data.ability = "cha";
          copyItem.name = "Pact " + copyItem.name;
          copyItem.data.equipped = true;
          tactor.createEmbeddedDocuments("Item", [copyItem]);
          let item = tactor.items.find(i => i.name === copyItem.name);
          if (item) item.update({ "data.proficient": true });
          let effect = tactor.effects.find(e => e.data === lastArg.efData);
          if (item && effect) effect.update({ changes: effect.data.changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: item.uuid, priority: 20 }]) });
        }
      },
      cancel: {
        label: `Cancel`,
      },
    },
  }).render(true);
}