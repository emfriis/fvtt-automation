// spiritual weapon

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const spellLevel = args[1];
const bonus = tactor.data.data.attributes.prof + tactor.data.data.abilities[tactor.data.data.attributes.spellcasting].mod;

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Spiritual Weapon");
    let summonUuid = spawnedTokenDoc.uuid;
    if (ef) {
        let changes = [
            {
                key: "flags.dae.deleteUuid",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                value: summonUuid,
                priority: 20,
            },
        ];
        await ef.update({ changes: changes.concat(ef.data.changes) });
    };
};

if (args[0] === "on") {
    let updates = {
        token: { "name": `Spiritual Weapon (${tactor.name})` },
        actor: { "name": `Spiritual Weapon (${tactor.name})` },
        embedded: {
            Item: {
                "Spiritual Weapon Attack": {
                    "data.attackBonus": bonus,
                    "data.damage.parts": [[`${Math.max(Math.floor(spellLevel / 2), 1)}d8`, "force"]]
                },
            },
        },
    };
    await warpgate.spawn("Spiritual Weapon", updates, { post: postWarp }, {});
};