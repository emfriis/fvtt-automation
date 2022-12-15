// flaming sphere 
// on use post effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const spellLevel = args[1];
const spellDC = tactor.data.data.attributes.spelldc;

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Flaming Sphere");
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

if (args[0] === "on") {
    let updates = {
        token: { "name": `Flaming Sphere (${tactor.name})` },
        actor: { "name": `Flaming Sphere (${tactor.name})` },
        embedded: {
            Item: {
                "Flaming Sphere Damage": {
                    "data.damage.parts": [[`${spellLevel - 1}d6`, "fire"]], 
                    "data.save.dc": spellDC
                },
            },
            ActiveEffect: {
                "Flaming Sphere Damage": {
                    "changes":  [{"key":"flags.midi-qol.OverTime","mode":5,"value": `label=Flaming Sphere (End of Turn),turn=end,saveDC=${spellDC},saveAbility=dex,damageRoll=${spellLevel - 1}d6,damageType=fire,saveDamage=halfdamage,saveRemove=false`,"priority":"20"}],
                    "disabled": false,
                    "icon": "systems/dnd5e/icons/spells/light-air-fire-3.jpg",
                    "label": "Flaming Sphere Damage",
                    "flags": {
                        "ActiveAuras": {
                            "isAura":true,
                            "aura":"All",
                            "radius":5,
                            "alignment":"",
                            "type":"",
                            "ignoreSelf":true,
                            "height":true,
                            "hidden":false,
                            "hostile":false,
                            "onlyOnce":false
                        },
                    },
                },
            },
        },
    };
    await warpgate.spawn("Flaming Sphere", updates, { post: postWarp }, {});
};