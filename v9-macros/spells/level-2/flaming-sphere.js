// flaming sphere 
// effect itemacro

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
                    "data.save.dc": spellDC,
                    "flags.midiProperties.spelleffect": true,
                },
            },
            ActiveEffect: {
                "Flaming Sphere Damage": {
                    "changes":  [{"key":"macro.execute","mode":CONST.ACTIVE_EFFECT_MODES.CUSTOM,"value":`ApplyDamage @token self 2d6 fire magiceffect spelleffect ${spellDC} dex halfdam`,"priority":"20"}],
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