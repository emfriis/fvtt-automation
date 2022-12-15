// guardian of faith

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Guardian of Faith");
    let summonUuid = spawnedTokenDoc.uuid;
    if (ef) {
        let changes = [
            { key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: summonUuid, priority: 20, }
        ];
        await ef.update({ changes: changes.concat(ef.data.changes) });
    }
    let effectData = {
        changes: [
            { key: "flags.parent", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: tactor.uuid, priority: 20, },
            { key: `data.attributes.spelldc`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: tactor.data.data.attributes.spelldc, priority: 20 },
        ],
        label: "Guardian of Faith",
        disabled: false,
        icon: "icons/magic/light/explosion-star-glow-orange.webp"
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: spawnedTokenDoc.actor.uuid, effects: [effectData] });
}

if (args[0] === "on") {
    let updates = {
        token: { 
            "name": `Guardian of Faith (${tactor.name})`, 
            //"disposition": token.data.disposition,
        },
        actor: {  "name": `Guardian of Faith (${tactor.name})`, },
    }
    await warpgate.spawn("Guardian of Faith", updates, { post: postWarp }, {});
}