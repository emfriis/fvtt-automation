let ECHItems = {}

Hooks.once("ready",()=>{
  ECHItems[game.i18n.localize("enhancedcombathud.items.disengage.name")] = {
    "name": game.i18n.localize("enhancedcombathud.items.disengage.name"),
    "type": "feat",
    "img": "modules/enhancedcombathud/icons/journey.svg",
    "data": {
      "description": {
        "value": game.i18n.localize("enhancedcombathud.items.disengage.desc"),
        "chat": "",
        "unidentified": ""
      },
      "source": "",
      "quantity": 1,
      "weight": 0,
      "price": 0,
      "attuned": false,
      "attunement": 0,
      "equipped": false,
      "rarity": "",
      "identified": true,
      "activation": {
        "type": "action",
        "cost": 1,
        "condition": ""
      },
      "duration": {
        "value": 1,
        "units": "turn"
      },
      "target": {
        "value": null,
        "width": null,
        "units": "",
        "type": "self"
      },
      "range": {
        "value": null,
        "long": null,
        "units": "self"
      },
      "consume": {
        "type": "",
        "target": "",
        "amount": null
      },
      "ability": "",
      "actionType": "util",
      "attackBonus": 0,
      "chatFlavor": "",
      "critical": null,
      "damage": {
        "parts": [],
        "versatile": ""
      },
      "formula": "",
      "save": {
        "ability": "",
        "dc": null,
        "scaling": "spell"
      },
    },
    "effects": [
      {
        "_id": "8FtZnIC1vbyKZ6xF",
        "changes": [],
        "disabled": false,
        "duration": {
          "startTime": null,
          "turns": 1
        },
        "icon": "modules/enhancedcombathud/icons/journey.svg",
        "label": "Disengage",
        "transfer": false,
        "flags": {
          "dae": {
            "stackable": "none",
            "macroRepeat": "none",
            "specialDuration": [],
            "transfer": false,
            "selfTarget": true,
          }
        },
        "tint": ""
      }
    ],
    "sort": 0,
    "flags": {
      "core": {
        "sourceId": "Item.wyQkeuZkttllAFB1"
      },
      "enhancedcombathud": {
        "set1p": false,
        "set2p": false,
        "set3p": false
      },
      "midi-qol": {
        "onUseMacroName": ""
      }
    }
  }
  ECHItems[game.i18n.localize("enhancedcombathud.items.hide.name")] = {
    "name": game.i18n.localize("enhancedcombathud.items.hide.name"),
    "type": "feat",
    "img": "modules/enhancedcombathud/icons/cloak-dagger.svg",
    "data": {
      "description": {
        "value": game.i18n.localize("enhancedcombathud.items.hide.desc"),
        "chat": "",
        "unidentified": ""
      },
      "source": "",
      "quantity": 1,
      "weight": 0,
      "price": 0,
      "attuned": false,
      "attunement": 0,
      "equipped": false,
      "rarity": "",
      "identified": true,
      "activation": {
        "type": "action",
        "cost": 1,
        "condition": ""
      },
      "duration": {
        "value": null,
        "units": ""
      },
      "target": {
        "value": null,
        "width": null,
        "units": "",
        "type": "self"
      },
      "range": {
        "value": null,
        "long": null,
        "units": ""
      },

      "consume": {
        "type": "",
        "target": "",
        "amount": null
      },
      "recharge": {
        "value": null,
        "charged": false
      },
      "ability": "",
      "actionType": "util",
      "attackBonus": 0,
      "chatFlavor": "",
      "critical": null,
      "damage": {
        "parts": [],
        "versatile": ""
      },
      "formula": "",
      "save": {
        "ability": "",
        "dc": null,
        "scaling": "spell"
      },
    },
    "effects": [],
    "sort": 0,
    "flags": {
      "enhancedcombathud": {
        "set1p": false,
        "set2p": false,
        "set3p": false,
        "set1s": false,
        "set2s": false,
        "set3s": false
      },
      "midi-qol": {
        "onUseMacroName": ""
      }
    }
  }
  ECHItems[game.i18n.localize("enhancedcombathud.items.shove.name")] = {
    "name": game.i18n.localize("enhancedcombathud.items.shove.name"),
    "type": "feat",
    "img": "modules/enhancedcombathud/icons/shield-bash.svg",
    "data": {
      "description": {
        "value": game.i18n.localize("enhancedcombathud.items.shove.desc"),
        "chat": "",
        "unidentified": ""
      },
      "source": "",
      "quantity": 1,
      "weight": 0,
      "price": 0,
      "attuned": false,
      "attunement": 0,
      "equipped": false,
      "rarity": "",
      "identified": true,
      "activation": {
        "type": "action",
        "cost": 1,
        "condition": ""
      },
      "duration": {
        "value": null,
        "units": ""
      },
      "target": {
        "value": 1,
        "width": null,
        "units": "",
        "type": "creature"
      },
      "range": {
        "value": null,
        "long": null,
        "units": "touch"
      },

      "consume": {
        "type": "",
        "target": "",
        "amount": null
      },
      "ability": "",
      "actionType": "util",
      "attackBonus": 0,
      "chatFlavor": "",
      "critical": null,
      "damage": {
        "parts": [],
        "versatile": ""
      },
      "formula": "",
      "save": {
        "ability": "",
        "dc": null,
        "scaling": "spell"
      },
    },
    "effects": [],
    "sort": 0,
    "flags": {
      "enhancedcombathud": {
        "set1p": false,
        "set2p": false,
        "set3p": false
      },
      "midi-qol": {
        "onUseMacroName": "[preambleComplete]Shove", // added shove macro name
        "onUseMacroParts": {
          "items": [
            {
              "macroName": "Shove",
              "option": "preambleComplete"
            }
          ]
        }
      }
    }
  }
  ECHItems[game.i18n.localize("enhancedcombathud.items.dash.name")] = {
    "name": game.i18n.localize("enhancedcombathud.items.dash.name"),
    "type": "feat",
    "img": "modules/enhancedcombathud/icons/walking-boot.svg",
    "data": {
      "description": {
        "value": game.i18n.localize("enhancedcombathud.items.dash.desc"),
        "chat": "",
        "unidentified": ""
      },
      "source": "",
      "quantity": 1,
      "weight": 0,
      "price": 0,
      "attuned": false,
      "attunement": 0,
      "equipped": false,
      "rarity": "",
      "identified": true,
      "activation": {
        "type": "action",
        "cost": 1,
        "condition": ""
      },
      "duration": {
        "value": null,
        "units": ""
      },
      "target": {
        "value": null,
        "width": null,
        "units": "",
        "type": "self"
      },
      "range": {
        "value": null,
        "long": null,
        "units": "self"
      },

      "consume": {
        "type": "",
        "target": "",
        "amount": null
      },
      "ability": "",
      "actionType": "util",
      "attackBonus": 0,
      "chatFlavor": "",
      "critical": null,
      "damage": {
        "parts": [],
        "versatile": ""
      },
      "formula": "",
      "save": {
        "ability": "",
        "dc": null,
        "scaling": "spell"
      },
    },
    "effects": [], // removed dash effect
    "sort": 0,
    "flags": {
      "enhancedcombathud": {
        "set1p": false,
        "set2p": false,
        "set3p": false
      },
      "midi-qol": {
        "onUseMacroName": ""
      }
    }
  }
  ECHItems[game.i18n.localize("enhancedcombathud.items.dodge.name")] = {
    "name": game.i18n.localize("enhancedcombathud.items.dodge.name"),
    "type": "feat",
    "img": "modules/enhancedcombathud/icons/armor-upgrade.svg",
    "data": {
      "description": {
        "value": game.i18n.localize("enhancedcombathud.items.dodge.desc"),
        "chat": "",
        "unidentified": ""
      },
      "source": "",
      "quantity": 1,
      "weight": 0,
      "price": 0,
      "attuned": false,
      "attunement": 0,
      "equipped": false,
      "rarity": "",
      "identified": true,
      "activation": {
        "type": "action",
        "cost": 1,
        "condition": ""
      },
      "duration": {
        "value": null,
        "units": ""
      },
      "target": {
        "value": null,
        "width": null,
        "units": "",
        "type": "self"
      },
      "range": {
        "value": null,
        "long": null,
        "units": "self"
      },

      "consume": {
        "type": "",
        "target": "",
        "amount": null
      },
      "ability": "",
      "actionType": "util",
      "attackBonus": 0,
      "chatFlavor": "",
      "critical": null,
      "damage": {
        "parts": [],
        "versatile": ""
      },
      "formula": "",
      "save": {
        "ability": "",
        "dc": null,
        "scaling": "spell"
      },
    },
    "effects": [
      { // added dodge effect properties
        "_id": "2xH2YQ6pm430O0Aq",
        "changes": [
          {
            key: "flags.midi-qol.grants.disadvantage.attack.all",
            mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
            value: 1,
            priority: 20,
          },
          {
            key: "flags.midi-qol.advantage.ability.save.dex",
            mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
            value: 1,
            priority: 20,
          }
        ],
        "disabled": false,
        "icon": "modules/enhancedcombathud/icons/armor-upgrade.svg",
        "label": "Dodge",
        "duration": {
          "startTime": null,
          "seconds": null
        },
        "transfer": false,
        "flags": {
          "dae": {
            "stackable": "none",
            "macroRepeat": "none",
            "specialDuration": ["turnStart"],
            "transfer": false,
            "selfTarget": true,
          },
          "core": { 
            "statusId": "Dodge" 
          }
        },
        "tint": ""
      }
    ],
    "sort": 0,
    "flags": {
      "enhancedcombathud": {
        "set1p": false,
        "set2p": false,
        "set3p": false
      },
      "midi-qol": {
        "onUseMacroName": ""
      }
    }
  }
  ECHItems[game.i18n.localize("enhancedcombathud.items.ready.name")] = {
    "name": game.i18n.localize("enhancedcombathud.items.ready.name"),
    "type": "feat",
    "img": "modules/enhancedcombathud/icons/clockwork.svg",
    "data": {
      "description": {
        "value": game.i18n.localize("enhancedcombathud.items.ready.desc"),
        "chat": "",
        "unidentified": ""
      },
      "source": "",
      "quantity": 1,
      "weight": 0,
      "price": 0,
      "attuned": false,
      "attunement": 0,
      "equipped": false,
      "rarity": "",
      "identified": true,
      "activation": {
        "type": "action",
        "cost": 1,
        "condition": ""
      },
      "duration": {
        "value": null,
        "units": ""
      },
      "target": {
        "value": null,
        "width": null,
        "units": "",
        "type": "self"
      },
      "range": {
        "value": null,
        "long": null,
        "units": "self"
      },

      "consume": {
        "type": "",
        "target": "",
        "amount": null
      },
      "ability": "",
      "actionType": "util",
      "attackBonus": 0,
      "chatFlavor": "",
      "critical": null,
      "damage": {
        "parts": [],
        "versatile": ""
      },
      "formula": "",
      "save": {
        "ability": "",
        "dc": null,
        "scaling": "spell"
      },
    },
    "effects": [
      {
        "_id": "BevDb0J80M9BdoEl",
        "changes": [],
        "disabled": false,
        "icon": "modules/enhancedcombathud/icons/clockwork.svg",
        "label": "Ready",
        "duration": {
          "startTime": null,
          "seconds": null
        },
        "transfer": false,
        "flags": {
          "dae": {
            "stackable": "none",
            "macroRepeat": "none",
            "specialDuration": ["turnStart"], // updated ready duration
            "transfer": false,
            "selfTarget": true,
          },
          "core": { 
            "statusId": "Ready" 
          }
        },
        "tint": ""
      }
    ],
    "sort": 0,
    "flags": {
      "enhancedcombathud": {
        "set1p": false,
        "set2p": false,
        "set3p": false
      },
      "midi-qol": {
        "onUseMacroName": ""
      }
    }
  }
  ECHItems["Help"] = { // added help item
    "name": "Help",
    "type": "feat",
    "img": "modules/enhancedcombathud/icons/upgrade.svg",
    "data": {
      "description": {
        "value": "", //"<p>You can lend your aid to another creature in the completion of a task. When you take the Help Action, the creature you aid gains advantage on the next ability check it makes to perform the task you are helping with, provided that it makes the check before the start of your next turn.\n\nAlternatively, you can aid a friendly creature in Attacking a creature within 5 feet of you. You feint, distract the target, or in some other way team up to make your ally’s Attack more effective. If your ally attacks the target before your next turn, the first Attack roll is made with advantage.</p>",
        "chat": "",
        "unidentified": ""
      },
      "source": "",
      "quantity": 1,
      "weight": 0,
      "price": 0,
      "attuned": false,
      "attunement": 0,
      "equipped": false,
      "rarity": "",
      "identified": true,
      "activation": {
        "type": "action",
        "cost": 1,
        "condition": ""
      },
      "duration": {
        "value": null,
        "units": ""
      },
      "target": {
        "value": 1,
        "width": null,
        "units": "",
        "type": "creature"
      },
      "range": {
        "value": null,
        "long": null,
        "units": "touch"
      },

      "consume": {
        "type": "",
        "target": "",
        "amount": null
      },
      "ability": "",
      "actionType": "util",
      "attackBonus": 0,
      "chatFlavor": "",
      "critical": null,
      "damage": {
        "parts": [],
        "versatile": ""
      },
      "formula": "",
      "save": {
        "ability": "",
        "dc": null,
        "scaling": "spell"
      },
    },
    "effects": [],
    "sort": 0,
    "flags": {
      "enhancedcombathud": {
        "set1p": false,
        "set2p": false,
        "set3p": false
      },
      "midi-qol": {
        "onUseMacroName": "[preambleComplete]Help",
        "onUseMacroParts": {
          "items": [
            {
              "macroName": "Help",
              "option": "preambleComplete"
            },
          ]
        }
      }
    }
  }
  ECHItems["Grapple"] = { // added grapple item WIP
    "name": "Grapple",
    "type": "feat",
    "img": "modules/enhancedcombathud/icons/mighty-force.svg",
    "data": {
      "description": {
        "value": "", //"<p>When you want to grab a creature or wrestle with it, you can use the Attack Action to make a Special melee Attack, a grapple. If you’re able to make multiple attacks with the Attack Action, this Attack replaces one of them.\n\nThe target of your grapple must be no more than one size larger than you and must be within your reach. Using at least one free hand, you try to seize the target by making a grapple check instead of an Attack roll: a Strength (Athletics) check contested by the target’s Strength (Athletics) or Dexterity (Acrobatics) check (the target chooses the ability to use). If you succeed, you Subject the target to the Grappled condition (see Conditions ). The condition specifies the things that end it, and you can release the target whenever you like (no Action required).\n\nEscaping a Grapple: A Grappled creature can use its Action to Escape. To do so, it must succeed on a Strength (Athletics) or Dexterity (Acrobatics) check contested by your Strength (Athletics) check.\n\nMoving a Grappled Creature: When you move, you can drag or carry the Grappled creature with you, but your speed is halved, unless the creature is two or more sizes smaller than you.</p>",
        "chat": "",
        "unidentified": ""
      },
      "source": "",
      "quantity": 1,
      "weight": 0,
      "price": 0,
      "attuned": false,
      "attunement": 0,
      "equipped": false,
      "rarity": "",
      "identified": true,
      "activation": {
        "type": "action",
        "cost": 1,
        "condition": ""
      },
      "duration": {
        "value": null,
        "units": ""
      },
      "target": {
        "value": 1,
        "width": null,
        "units": "",
        "type": "creature"
      },
      "range": {
        "value": null,
        "long": null,
        "units": "touch"
      },

      "consume": {
        "type": "",
        "target": "",
        "amount": null
      },
      "ability": "",
      "actionType": "util",
      "attackBonus": 0,
      "chatFlavor": "",
      "critical": null,
      "damage": {
        "parts": [],
        "versatile": ""
      },
      "formula": "",
      "save": {
        "ability": "",
        "dc": null,
        "scaling": "spell"
      },
    },
    "effects": [], 
    "sort": 0,
    "flags": {
      "enhancedcombathud": {
        "set1p": false,
        "set2p": false,
        "set3p": false
      },
      "midi-qol": {
        "onUseMacroName": "[preambleComplete]Grapple",
        "onUseMacroParts": {
          "items": [
            {
              "macroName": "Grapple",
              "option": "preambleComplete"
            },
          ]
        }
      }
    }
  }
})