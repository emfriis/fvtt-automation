// create bonfire
// macro.itemMacro - @details.level @details.cr @attributes.spelldc
// aura - all, 5ft, check height, apply effect

if(!game.modules.get("ActiveAuras")?.active) {
  ui.notifications.error("ActiveAuras is not enabled");
  return;
};

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function applySaveAdvantage() {
  const resist = ["Magic Resistance", "Spell Resistance"];
  const getResist = tactor.items.find(i => resist.includes(i.name)) || tactor.effects.find(i => resist.includes(i.data.label));
  if (getResist) {
    const effectData = {
      changes: [{ key: "flags.midi-qol.advantage.ability.save.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
      disabled: false,
      flags: { dae: { specialDuration: ["isSave"] } },
      label: `Save Advantage`,
    };
    await tactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
  };
};

async function applyItem(sourceItem, cantripDice, saveDC, damageType, saveType) {
  const itemData = mergeObject(
    duplicate(sourceItem.data),
    {
      type: "feat",
      effects: [],
      flags: {
        "midi-qol": {
            onUseMacroName: null, // no macro
        },
      },
      data: {
        equipped: true,
        actionType: "save",
        save: { dc: saveDC, ability: saveType, scaling: "flat" },
        damage: { parts: [[`${cantripDice}d8`, damageType]] },
        "target.type": "self",
        components: { concentration: false, material: false, ritual: false, somatic: false, value: "", vocal: false },
        duration: { units: "inst", value: undefined },
      },
    },
    { overwrite: true, inlace: true, insertKeys: true, insertValues: true }
  );
  setProperty(itemData.flags, "autoanimations.killAnim", true);
  const item = new CONFIG.Item.documentClass(itemData, { parent: tactor });
  const options = { showFullCard: false, createWorkflow: true, versatile: false, configureDialog: false };
  await MidiQOL.completeItemRoll(item, options);
};

if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
  return await AAhelpers.applyTemplate(args);
} else if (args[0] === "on") {
  const efTurn = DAE.getFlag(token, lastArg.efData.id); 
  if (game.combat.turn === efTurn && game.combat.round === lastArg.efData.duration.startRound) return;
  const sourceItem = await fromUuid(lastArg.efData.origin);
  const cantripDice = args[1] ? 1 + Math.floor((args[1] + 1) / 6) : 1 + Math.floor((args[2] + 1) / 6);
  const saveDC = args[3];
  const damageType = "fire";
  const saveType = "dex";
  if (!sourceItem || !cantripDice || !saveDC) return;
  await applySaveAdvantage();
  await applyItem(sourceItem, cantripDice, saveDC, damageType, saveType);
  await DAE.setFlag(token, lastArg.efData.id, game.combat.turn);
} else if (args[0] === "each") {
  const sourceItem = await fromUuid(lastArg.efData.origin);
  const cantripDice = args[1] ? 1 + Math.floor((args[1] + 1) / 6) : 1 + Math.floor((args[2] + 1) / 6);
  const saveDC = args[3];
  const damageType = "fire";
  const saveType = "dex";
  if (!sourceItem || !cantripDice || !saveDC) return;
  await applySaveAdvantage();
  await applyItem(sourceItem, cantripDice, saveDC, damageType, saveType);
};