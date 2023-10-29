// earthen grasp
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Maximilian's Earthen Grasp");
    let summonUuid = spawnedTokenDoc.uuid;
    if (ef) {
        let changes = [{ key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: summonUuid, priority: 20, }];
        await ef.update({ changes: changes.concat(ef.data.changes) });
    };
    let effectData = [{
        changes: [
            { key: `data.attributes.spelldc`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: tactor.data.data.attributes.spelldc, priority: 20 },
            { key: "flags.parent", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.tokenId, priority: 20, },
        ],
        disabled: false,
        label: "Earthen Grasp",
        icon: "icons/magic/earth/strike-fist-stone-gray.webp"
    }];
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: spawnedTokenDoc.actor.uuid, effects: [effectData] });
};

if (args[0] === "on") {
    let updates = {
        token: { "name": `Earthen Hand (${tactor.name})` },
        actor: { "name": `Earthen Hand (${tactor.name})` },
    };
    await warpgate.spawn("Earthen Hand", updates, { post: postWarp }, {});
}
