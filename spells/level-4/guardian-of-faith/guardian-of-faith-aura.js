// guardian of faith aura
// GuardianOfFaith @token
// ignore self, check height, apply effect

const lastArg = args[args.length - 1];
const token =  await fromUuid(lastArg.tokenUuid);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

if (args[0] === "on") {
    let sourceToken = canvas.tokens.get(args[1]);
    if (!sourceToken || token.data.disposition === sourceToken.data.disposition) return;
    await wait(100);
    await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: lastArg.effectId, flags: { dae: { specialDuration: ["isMoved"] } } }] });
}

if (args[0] === "off" && lastArg["expiry-reason"] === "midi-qol:isMoved") {
    let sourceToken = canvas.tokens.get(args[1]);
    if (!sourceToken) return;
    if (tactor.getFlag("midi-qol", "guardianTime") !== `${game.combat.id}-${game.combat.round + game.combat.turn /100}` && MidiQOL.getDistance(sourceToken, token, false) <= 10) {
        let item;
        if (sourceToken.actor) item = sourceToken.actor.items.find(i => i.name === "Guardian of Faith Attack");
        let options = { targetUuids: [lastArg.tokenUuid] };
        if (item) await MidiQOL.completeItemRoll(item, options);
        tactor.setFlag("midi-qol", "guardianTime", `${game.combat.id}-${game.combat.round + game.combat.turn /100}`);
    } else if (MidiQOL.getDistance(sourceToken, token, false) <= 15) {
        await wait(100);
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [lastArg.efData] });
    }
}