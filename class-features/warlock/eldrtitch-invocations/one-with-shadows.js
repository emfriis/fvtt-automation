// one with shadows
// effect on use pre effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.macroPass === "preActiveEffects" && ["action", "bonus", "reaction", "reactiondamage", "reactionmanual"].includes(lastArg.item.data.activation.type)) {
    let shadowsItem = tactor.items.find(i => i.name === "Eldritch Invocations: One with Shadows");
    if (shadowsItem) shadows = tactor.effects.find(e => e.data.label === "Invisible" && e.data.origin === shadowsItem.uuid);
    if (shadows) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [shadows.id] });
}