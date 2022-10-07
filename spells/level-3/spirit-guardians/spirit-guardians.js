// spirit guardians
// data.attributes.movement.all - /2
// macro.itemMacro - @token @spellLevel @attributes.spelldc @data.details.alignment
// aura - enemies, 15ft, check height, apply effect, only apply current turn, only once per turn

const lastArg = args[args.length - 1];
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

// Check when applying the effect - if the token is not the caster and it IS the tokens turn they take damage
if (args[0] === "on" && args[1] !== lastArg.tokenId && lastArg.tokenId === game.combat?.current.tokenId) {
  const sourceItem = await fromUuid(lastArg.origin);
  const isEvil = typeof args[5] === "string" ?  args[5]?.toLowerCase().includes("evil") : false;
  const damageType = isEvil ? "necrotic" : "radiant";

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
        "activationType": "none",
        actionType: "save",
        save: { dc: Number.parseInt(args[3]), ability: "wis", scaling: "flat" },
        damage: { parts: [[`${args[2]}d8`, damageType]] },
        "target.type": "creature",
        components: { concentration: false, material: false, ritual: false, somatic: false, value: "", vocal: false },
        duration: { units: "inst", value: undefined },
      },
    },
    { overwrite: true, inlace: true, insertKeys: true, insertValues: true }
  );
  itemData.data.target.type = "creature";
  setProperty(itemData.flags, "autoanimations.killAnim", true);
  const item = new CONFIG.Item.documentClass(itemData, { parent: sourceItem.parent });
  const options = { showFullCard: false, createWorkflow: true, versatile: false, configureDialog: false, targetUuids: [lastArg.tokenUuid] };
  await applySaveAdvantage();
  await MidiQOL.completeItemRoll(item, options);

  tactor?.deleteEmbeddedDocuments("ActiveEffect", [lastArg.efData.id ?? lastArg.efData._id]);
};