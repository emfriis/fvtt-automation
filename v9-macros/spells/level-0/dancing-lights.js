// dancing lights
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Dancing Lights");
    let summonUuid = spawnedTokenDoc.uuid;
    if (ef) {
        let changes = [{ key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: summonUuid, priority: 20, }];
        await ef.update({ changes: changes.concat(ef.data.changes) });
    };
    let effectData = {
        changes: [{ key: "flags.parent", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.tokenId, priority: 20, }],
        label: "Dancing Lights",
        disabled: false,
        icon: "systems/dnd5e/icons/spells/fire-arrows-sky-1.jpg"
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: spawnedTokenDoc.actor.uuid, effects: [effectData] });
};

if (args[0] === "on") {
    let updates = {
        token: { "name": `Dancing Light (${tactor.name})` },
        actor: { "name": `Dancing Light (${tactor.name})` }
    };
    await warpgate.spawn("Dancing Light", updates, { post: postWarp }, {});
    await warpgate.spawn("Dancing Light", updates, { post: postWarp }, {});
    await warpgate.spawn("Dancing Light", updates, { post: postWarp }, {});
    await warpgate.spawn("Dancing Light", updates, { post: postWarp }, {});
};