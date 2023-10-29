// Macro written by Crymic : goto https://www.patreon.com/crymic for more!
const lastArg = args[args.length - 1];
const damageList = { 1: "acid", 2: "cold", 3: "fire", 4: "force", 5: "lightning", 6: "poison", 7: "psychic", 8: "thunder" };
const actorD = game.actors.get(lastArg.actor._id);
const tokenD = canvas.tokens.get(lastArg.tokenId);
const itemD = lastArg.item;
const spellLevel = Number(lastArg.spellLevel);
const upcast = spellLevel;
let target;

if (lastArg.hitTargets.length > 0) {
  target = canvas.tokens.get(lastArg.hitTargets[0].id);
  await dealDamage(target, null, null, itemD);  
} else {
  target = canvas.tokens.get(lastArg.targets[0].id);  
}

async function findTarget(target, itemD) {
  let get_targets = await MidiQOL.findNearby(CONST.TOKEN_DISPOSITIONS.FRIENDLY, target, 30, null);
  await rollAttack(get_targets, itemD);
}

async function rollAttack(get_targets, itemD) {
  let targetList;
  for (let target of get_targets) {
    targetList += `<option value="${target.id}">${target.name}</option>`;
  }
  let dialog = new Promise((resolve) => {
  new Dialog({
    title: `${itemD.name} : New Target`,
    content: `<form><div class="form-group"><label for="target">Pick Target</label><select id="target">${targetList}</select></div></form>`,
    buttons: {
      attack: {
        label: "Attack",
        callback: async (html) => {
          let find_target = html.find('#target').val();
          let get_target = canvas.tokens.get(find_target);
          await get_target.setTarget(true, { releaseOthers: true });
          let roll = actorD.items.get(itemD._id).rollAttack();
          if (roll.total >= get_target.actor.data.data.attributes.ac.value) {
            const newCritical = roll.terms[0].total === 20 ? true : false;
            await dealDamage(get_target, 1, newCritical, itemD);           
          }
          resolve();
        }
      }
    },
    default: "attack"
  }).render(true);
  });
  await dialog;
}

async function dealDamage(target, reCast, newCritical, itemD) { 
  let numDice = newCritical ? `1d8 + 1d8 + 2d8 + ${upcast * 2}d6` : lastArg.isCritical ? `1d8 + 1d8 + 2d8 + ${upcast * 2}d6` : `1d8 + 1d8 + ${upcast}d6`;
  let damageRoll = new Roll(`${numDice}`).evaluate({ async: false });
  let firstElement = damageList[damageRoll.terms[0].total];
  let secondElement = damageList[damageRoll.terms[2].total];
  let selectElement;
  let castAgain = 0;
  let elementList = [];
  if (firstElement != secondElement) {
    elementList.push(firstElement);
    elementList.push(secondElement);
    castAgain = 0;
  } else {
    elementList = firstElement;
    castAgain = 1;
  }
  for (let element of elementList) {
    selectElement += `<option value="${element}">${element}</option>`;
  }
  if (firstElement === secondElement) {
    damageRoll.terms[0].options.flavor = elementList;
    damageRoll.terms[2].options.flavor = elementList;
    damageRoll.terms[4].options.flavor = elementList;
    lastArg.isCritical ? damageRoll.terms[6].options.flavor = elementList : "";
    game.dice3d?.showForRoll(damageRoll);
    if (reCast === 1) {
      let msgHistory = game.messages.filter(i => i.data.flavor === itemD.name && i.data.speaker.token === tokenD.id);
      let lastMessage = msgHistory.pop();
      let newId = lastMessage.data._id;
      await workflowDamage(damageRoll, elementList, target, newId, itemD);
    } else {
      await workflowDamage(damageRoll, elementList, target, lastArg.itemCardId, itemD);      
    }
    if (castAgain === 1) {
      await findTarget(target, itemD);
    }
  } else {
    let the_message = `<form><div class="form-group"><label for="element">Pick Element</label><select id="element">${selectElement}</select></div></form>`;
    let dialog = new Promise((resolve) => {
    new Dialog({
      title: itemD.name,
      content: the_message,
      buttons: {
        damage: {
          label: "Damage",
          callback: async (html) => {
            let element = html.find('#element').val();
            damageRoll.terms[0].options.flavor = element;
            damageRoll.terms[2].options.flavor = element;
            damageRoll.terms[4].options.flavor = element;
            lastArg.isCritical ? damageRoll.terms[6].options.flavor = element : "";
            game.dice3d?.showForRoll(damageRoll);
            if (reCast === 1) {
              let msgHistory = game.messages.filter(i => i.data.flavor === itemD.name && i.data.speaker.token === tokenD.id);
              let lastMessage = msgHistory.pop();
              let newId = lastMessage.data._id;              
              await workflowDamage(damageRoll, element, target, newId, itemD);
            } else {
              await workflowDamage(damageRoll, element, target, lastArg.itemCardId, itemD);
            }
            resolve();
          }
        }
      },
      default: "damage"
    }).render(true);
  });
  await dialog;
  }
}

async function workflowDamage(damageRoll, element, target, cardId, itemD) {  
  let damageWorkflow = await new MidiQOL.DamageOnlyWorkflow(actorD, tokenD, damageRoll.total, element, [target], damageRoll, { flavor: `(${element})`, itemCardId: cardId, itemData: itemD, useOther: false });
  let damageBonusMacro = getProperty(actorD.data.flags, `${game.system.id}.DamageBonusMacro`);
  if (damageBonusMacro) {
    await damageWorkflow.rollBonusDamage(damageBonusMacro);
  } else {
    await damageWorkflow;
  }
}