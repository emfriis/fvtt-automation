// summoon shadowspawn

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const spellLevel = args[1];
const bonus = tactor.data.data.attributes.prof + tactor.data.data.abilities[tactor.data.data.attributes.spellcasting].mod;

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Summon Shadowspawn");
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
        token: { "name": `Shadow Spirit (${tactor.name})` },
        actor: { 
            "name": `Shadow Spirit (${tactor.name})`, 
            "data": { 
                "data": { 
                    "attributes": {
                        "hp": {
                            "value": spellLevel * 15 - 10,
                            "max": spellLevel * 15 - 10
                        },
                        "ac": {
                            "value": 11 + spellLevel
                        }
                    }
                }
            }
        },
        embedded: {
            Item: {
                "Chilling Rend": {
                    "data.attackBonus": bonus,
                    "data.damage.parts": [[`1d12 + 3 + ${spellLevel}`, "cold"]]
                },
            },
        },
    };
    await warpgate.spawn("Shadow Spirit", updates, { post: postWarp }, {});
};