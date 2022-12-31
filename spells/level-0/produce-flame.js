// produce-flame
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "on") {
  const itemData = {
    "name": `Flame (${lastArg.efData.label})`,
    "type": "feat",
    "img": lastArg.efData.icon,
    "data": {
      "description": { "value": `<p>You can hurl the flame at a creature within 30 feet of you.</p>\n<p>Make a ranged spell attack. On a hit, the target takes [[/r 1d8]] fire damage.</p>\n<p>This spell's damage increases by [[/r 1d8]] when you reach 5th level ([[/r 2d8]]), 11th level ([[/r 3d8]]), and 17th level ([[/r 4d8]]).</p>` },
      "activation": { "type": "action", "cost": 1 },
      "target": { "value": null, "type": "creature" },
      "range": { "value": 30, "units": "ft" },
      "actionType": "rsak",
      "attackBonus": "5 - @mod",
      "damage": { "parts": [[`1d8[fire]`, "fire"]] },
    },
    "flags": { "midi-qol": { "onUseMacroName": "[postAttackRoll]ItemMacro" },
      "itemacro": {
        "macro": {
          "data": {
            "_id": null,
            "name": `Flame (${lastArg.efData.label})`,
            "type": "script",
            "scope": "global",
            "command": "const lastArg = args[args.length - 1];\nconst tokenOrActor = await fromUuid(lastArg.actorUuid);\nconst tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;\nconst effect = tactor.effects.find(e => e.data.label === \"Produce Flame\")\nif (effect) await MidiQOL.socket().executeAsGM(\"removeEffects\", { actorUuid: tactor.uuid, effects: [effect.id] });",
          }
        }
      }
    }
  }
  await tactor.createEmbeddedDocuments("Item", [itemData]);
}

if (args[0] === "off") {
  const item = tactor.items.find(i => i.name === `Flame (${lastArg.efData.label})`);
  if (item) await tactor.deleteEmbeddedDocuments("Item", [item.id]);
}