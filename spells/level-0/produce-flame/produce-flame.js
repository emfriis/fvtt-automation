// produce-flame

const lastArg = args[args.length - 1];
let actorD;
if (lastArg.tokenId) actorD = canvas.tokens.get(lastArg.tokenId).actor;
else actorD = game.actors.get(lastArg.actorId);
const target = canvas.tokens.get(lastArg.tokenId);
const itemD = lastArg.efData.flags.dae.itemData;

if (args[0] === "on") {
  let itemData = [{
    "name": `Flame (${itemD.name})`,
    "type": "consumable",
    "img": "systems/dnd5e/icons/spells/explosion-orange-2.jpg",
    "data": {
      "description": {
        "value": `<p>You can hurl the flame at a creature within 30 feet of you.</p>\n<p>Make a ranged spell attack. On a hit, the target takes [[/r 1d8]] fire damage.</p>\n<p>This spell's damage increases by [[/r 1d8]] when you reach 5th level ([[/r 2d8]]), 11th level ([[/r 3d8]]), and 17th level ([[/r 4d8]]).</p>`
      },
      "activation": {
        "type": "action",
        "cost": 1
      },
      "target": {
        "value": 1,
        "type": "creature"
      },
      "range": {
        "value": 30,
        "units": "ft"
      },
      "actionType": "rsak",
      "damage": {
        "parts": [
          [
            "1d8[fire]",
            "fire"
          ]
        ],
        "versatile": ""
      },
      "save": {
        "scaling": "spell"
      },
      "level": 0,
      "school": "con",
      "components": {
        "vocal": true,
        "somatic": true
      },
      "preparation": {
        "mode": "innate",
        "prepared": true
      },
      "scaling": {
        "mode": "cantrip",
        "formula": "1d8"
      }
    },
    "effects": [],
    "flags": {
      "midi-qol": {
        "onUseMacroName": "[all]ItemMacro",
        "criticalThreshold": "20",
        "effectActivation": false
      },
      "itemacro": {
        "macro": {
          "data": {
            "_id": null,
            "name": `Flame (${itemD.name})`,
            "type": "script",
            "author": "Tyd5yiqWrRZMvG30",
            "img": "icons/svg/dice-target.svg",
            "scope": "global",
            "command": "const lastArg = args[args.length - 1];\nlet tokenD = canvas.tokens.get(lastArg.tokenId);\nlet actorD = tokenD.actor;\nlet hit = lastArg.hitTargets.length > 0 ? true : false;\nlet target = hit ? canvas.tokens.get(lastArg.hitTargets[0].id) : canvas.tokens.get(lastArg.targets[0].id);\nlet effect = actorD.effects.find(i => i.data.label === \"Produce Flame\");\n\nif((!hit) && (lastArg.macroPass === \"postAttackRoll\")){    \n    if (effect) await MidiQOL.socket().executeAsGM(\"removeEffects\", { actorUuid: actorD.uuid, effects: [effect.id] });\n    await anime(tokenD, target, hit);\n}\nif ((hit) && (lastArg.macroPass === \"preActiveEffects\")){    \n    if (effect) await MidiQOL.socket().executeAsGM(\"removeEffects\", { actorUuid: actorD.uuid, effects: [effect.id] });\n    await anime(tokenD, target, hit);\n}\n\nasync function anime(tokenD, target, hit){\nif (!(game.modules.get(\"jb2a_patreon\")?.active || game.modules.get(\"JB2A_DnD5e\")?.active)) return {};\nif (!(game.modules.get(\"sequencer\")?.active)) return {};\nnew Sequence()\n    .effect()\n    .atLocation(tokenD)\n    .stretchTo(target)\n    .file(\"jb2a.fire_bolt.orange\")\n    .missed(!hit)\n    .waitUntilFinished(-500)\n.play()\n}",
            "folder": null,
            "sort": 0,
            "permission": {
              "default": 0
            },
            "flags": {}
          }
        }
      }
    }
  }];

  await actorD.createEmbeddedDocuments("Item", itemData);
}

if (args[0] === "off") {
  let getItem = actorD.items.find(i => i.name === `Flame (${itemD.name})`);
  if (!getItem) return {};
  await getItem.delete();
}