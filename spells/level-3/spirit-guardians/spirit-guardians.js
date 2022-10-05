// spirit guardians
// data.attributes.movement.all - /2
// macro.itemMacro - @token @spellLevel @attributes.spelldc @data.details.alignment
// aura - enemies, 15ft, check height, apply effect, only apply current turn, only once per turn

const lastArg = args[args.length - 1];

// Check when applying the effect - if the token is not the caster and it IS the tokens turn they take damage
if (args[0] === "on" && args[1] !== lastArg.tokenId && lastArg.tokenId === game.combat?.current.tokenId) {
  const sourceItem = await fromUuid(lastArg.origin);
  const tokenOrActor = await fromUuid(lastArg.actorUuid);
  const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  const isEvil = args[5] ?  args[5]?.toLowerCase().includes("evil") : false;
  const damageType = isEvil ? "necrotic" : "radiant";

  const itemData = mergeObject(
    duplicate(sourceItem.data),
    {
      type: "feat",
      effects: [],
      flags: {
        "midi-qol": {
          noProvokeReaction: true, // no reactions triggered
          onUseMacroName: null, // no macro
        },
      },
      data: {
        equipped: true,
        actionType: "save",
        save: { dc: Number.parseInt(args[3]), ability: "wis", scaling: "flat" },
        damage: { parts: [[`${args[2]}d8`, damageType]] },
        "target.type": "self",
        components: { concentration: false, material: false, ritual: false, somatic: false, value: "", vocal: false },
        duration: { units: "inst", value: undefined },
      },
    },
    { overwrite: true, inlace: true, insertKeys: true, insertValues: true }
  );
  itemData.data.target.type = "self";
  setProperty(itemData.flags, "autoanimations.killAnim", true);
  const item = new CONFIG.Item.documentClass(itemData, { parent: tactor });
  const options = { showFullCard: false, createWorkflow: true, versatile: false, configureDialog: false };
  await MidiQOL.completeItemRoll(item, options);

  tactor?.deleteEmbeddedDocuments("ActiveEffect", [lastArg.efData.id ?? lastArg.efData._id]);
};