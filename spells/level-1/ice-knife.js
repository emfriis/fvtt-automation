// ice knife
// on use

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const casterActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const casterToken = await fromUuid(lastArg.tokenUuid);

if (lastArg.targets.length > 0) {
  let areaSpellData = duplicate(lastArg.item);
  const damageDice = 1 + lastArg.spellLevel;
  delete(areaSpellData.effects);
  delete(areaSpellData.id);
  delete(areaSpellData.flags["midi-qol"].onUseMacroName);
  delete(areaSpellData.flags["midi-qol"].onUseMacroParts);
  delete(areaSpellData.flags.itemacro);
  areaSpellData.name = "Ice Explosion";
  areaSpellData.data.damage.parts = [[`${damageDice}d6[cold]`, "cold"]];
  areaSpellData.data.actionType = "save";
  areaSpellData.data.save.ability = "dex";
  areaSpellData.data.scaling = { mode: "level", formula: "1d6" };
  areaSpellData.data.preparation.mode ="atwill";
  const areaSpell = new CONFIG.Item.documentClass(areaSpellData, { parent: casterActor })
  const target = canvas.tokens.get(lastArg.targets[0].id);
  const aoeTargets = await canvas.tokens.placeables.filter((placeable) =>
    MidiQOL.getDistance(target, placeable, false) <= 5 &&
    !canvas.walls.checkCollision(new Ray(target.center, placeable.center)
  )).map((placeable) => placeable.document.uuid);

  const options = {
    showFullCard: false,
    createWorkflow: true,
    targetUuids: aoeTargets,
    configureDialog: false,
    versatile: false,
    consumeResource: false,
    consumeSlot: false,
  };

  await MidiQOL.completeItemRoll(areaSpell, options);
} else {
  ui.notifications.error("Ice Knife: No target selected: unable to automate burst effect.");
}