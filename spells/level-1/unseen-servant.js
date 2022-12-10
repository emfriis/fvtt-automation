// unseen servant
// on use post active effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Unseen Servant");
    let summonUuid = spawnedTokenDoc.uuid;
    if (ef) {
        let changes = [
            {
                key: "flags.dae.deleteUuid",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                value: summonUuid,
                priority: 20,
            }
        ];
        await ef.update({ changes: changes.concat(ef.data.changes) });
    };
};

let updates = {
    token: { "name": `Unseen Servant (${tactor.name})` },
    actor: { "name": `Unseen Servant (${tactor.name})` }
};
await warpgate.spawn("Unseen Servant", updates, { post: postWarp }, {});