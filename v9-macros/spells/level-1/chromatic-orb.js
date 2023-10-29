// thanks to Kekilla for an great dialog macro.
// Midi-qol on use Chromatic Orb, It handles damage. 
async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const damage_types = ["acid", "cold", "fire", "lightning", "poison", "thunder"];
const lastArg = args[args.length - 1];
if (lastArg.hitTargets.length === 0) return {};
let actorD = game.actors.get(lastArg.actor._id);
let tokenD = canvas.tokens.get(lastArg.tokenId);
let damageType = await choose(damage_types, 'Choose Damage Type : ');
let target = canvas.tokens.get(lastArg.hitTargets[0].id);
let itemD = lastArg.item;
itemD.data.level = lastArg.spellLevel;
let level = Number(lastArg.spellLevel) + 2;
let damageDice = lastArg.isCritical ? level * 2 : level;
let damageRoll = new Roll(`${damageDice}d8[${damageType}]`).evaluate({ async: false });
let damageWorkflow = await new MidiQOL.DamageOnlyWorkflow(actorD, tokenD, damageRoll.total, damageType, [target], damageRoll, { flavor: `(${CONFIG.DND5E.damageTypes[damageType]})`, itemCardId: lastArg.itemCardId, itemData: itemD, useOther: false });
console.log(damageWorkflow);
let damageBonusMacro = getProperty(actorD.data.flags, `${game.system.id}.DamageBonusMacro`);
if (damageBonusMacro) {
  await damageWorkflow.rollBonusDamage(damageBonusMacro);
} else {
  await damageWorkflow;
};

async function choose(options = [], prompt = ``) {
  let value = await new Promise((resolve) => {

    let dialog_options = (options[0] instanceof Array)
      ? options.map(o => `<option value="${o[0]}">${o[1]}</option>`).join(``)
      : options.map(o => `<option value="${o}">${o}</option>`).join(``);

    let content = `<form><div class="form-group"><label for="choice">${prompt}</label><select id="choice">${dialog_options}</select></div></form>`;

    new Dialog({
      content,
      buttons: { OK: { label: `OK`, callback: async (html) => { resolve(html.find('#choice').val()); } } }
    }).render(true);
  });
  return value;
}