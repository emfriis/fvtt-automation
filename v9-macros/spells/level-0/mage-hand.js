// mage hand 
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Mage Hand");
    let summonUuid = spawnedTokenDoc.uuid;
    if (ef) {
        let changes = [{ key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: summonUuid, priority: 20, }];
        await ef.update({ changes: changes.concat(ef.data.changes) });
    };
    let effectData = {
        changes: [{ key: "flags.parent", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.tokenId, priority: 20, }],
        label: "Mage Hand",
        disabled: false,
        icon: "icons/magic/unholy/hand-marked-pink.webp"
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: spawnedTokenDoc.actor.uuid, effects: [effectData] });
};

if (args[0] === "on") {
    let updates = {
        token: { "name": `Mage Hand (${tactor.name})` },
        actor: { "name": `Mage Hand (${tactor.name})` }
    };
    await warpgate.spawn("Mage Hand", updates, { post: postWarp }, {});
};