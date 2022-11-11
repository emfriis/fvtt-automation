// sanctuary

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const token = canvas.tokens.get(lastArg.tokenId);

if (args[0].tag === "OnUse") {
    if (!["mwak","rwak","msak","rsak"].includes(lastArg.item.data.actionType) && !lastArg.item.type === "spell") return;
    if (!lastArg.targets.find(t => t.data.disposition !== token.data.disposition)) return;
    let ef = await tactor.effects.filter(e => e.data.label === "Sanctuary");
    await tactor.deleteEmbeddedDocuments("ActiveEffect", ef.map((s) => s.id));
}