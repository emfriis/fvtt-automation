// guardian of faith aura
// GuardianOfFaith @actorUuid @attributes.spelldc
// ignore self, check height, disable while hidden, apply effect, once per turn

const lastArg = args[args.length - 1];
const token =  await fromUuid(lastArg.tokenUuid);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

if (args[0] === "off") {
    let source = await fromUuid(lastArg.origin);
    console.warn(source.parent);
    if (!source.parent.uuid || lastArg.actorUuid === source.parent.uuid) return;
    let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
    if (applyDamage) await applyDamage.execute("ApplyDamage", source.parent.uuid, lastArg.tokenUuid, "20", "radiant", "magiceffect", "spelleffect", args[1], "dex", "halfdam");
    
    await wait (500);
    await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: lastArg.actorUuid, effects: [lastArg.effectId] });
}

if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    console.warn(args);
    if (args[0].item.data.damage.parts && args[0].item.data.damage.parts[0][1] === "radiant") {
        console.warn("in");
    }
}