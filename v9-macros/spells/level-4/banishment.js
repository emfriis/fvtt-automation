// banishment
// effect itemacro

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "on") {
  await tactor.setFlag("midi-qol", "banishmentElevation", token.data.elevation);
  await canvas.scene.updateEmbeddedDocuments("Token", [{ _id: token.data._id, hidden: true, elevation: -9999 }]);
}

if (args[0]=== "off") {
  const elevation = await tactor.getFlag("midi-qol", "banishmentElevation", token.data.elevation);
  await tactor.unsetFlag("midi-qol", "banishmentElevation");
  await canvas.scene.updateEmbeddedDocuments("Token", [{ _id: token.data._id, hidden: false, elevation: elevation }]);
}