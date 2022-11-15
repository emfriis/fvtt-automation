// maximilian's earthen grasp
// on use post active effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Maximilian's Earthen Grasp");
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
    await wait(500);
    const summon = await fromUuid(summonUuid);
    const summonActor = summon.actor;
    let effectData = [{
        changes: [
            { key: `data.attributes.spelldc`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: tactor.data.data.attributes.spelldc, priority: 20 },
        ],
        disabled: false,
        label: "Spell DC",
    }];
    await summonActor.createEmbeddedDocuments("ActiveEffect", effectData);
};

let updates = {
    token: { "name": `Earthen Hand (${tactor.name})` },
    actor: { "name": `Earthen Hand (${tactor.name})` },
};
await warpgate.spawn("Earthen Hand", updates, { post: postWarp }, {});
