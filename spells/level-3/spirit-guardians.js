// spirit guardians
// data.attributes.movement.all - /2
// macro.itemMacro - @token @spellLevel @attributes.spelldc @data.details.alignment
// aura - enemies, 15ft, check height, apply effect, only apply current turn, only once per turn

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

// Check when applying the effect - if the token is not the caster and it IS the tokens turn they take damage
if (args[0] === "on" && args[1] !== lastArg.tokenId && lastArg.tokenId === game.combat?.current.tokenId) {
  const isEvil = typeof args[5] === "string" ?  args[5]?.toLowerCase().includes("evil") : false;
  const damageDice = `${args[2]}d8`;
  const damageType = isEvil ? "necrotic" : "radiant";
  const saveDC = args[3];
  const saveType = "wis";

  let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
  if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.actorUuid, "self", damageDice, damageType, "magiceffect", "spelleffect", saveDC, saveType, "halfdam");
  
  await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [lastArg.efData.id] });
};