// arcane hand 
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const spellLevel = args[1];
const bonus = tactor.data.data.attributes.prof + tactor.data.data.abilities[tactor.data.data.attributes.spellcasting]?.mod ?? tactor.data.data.abilities.int.mod;

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Arcane Hand");
    let summonUuid = spawnedTokenDoc.uuid;
    if (ef) {
        let changes = [{ key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: summonUuid, priority: 20, }];
        await ef.update({ changes: changes.concat(ef.data.changes) });
    };
    let effectData = {
        changes: [
            { key: "flags.parent", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.tokenId, priority: 20, },
            { key: "flags.spellmod", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: tactor.data.data.abilities[tactor.data.data.attributes.spellcasting]?.mod ?? tactor.data.data.abilities.int.mod, priority: 20, },
            { key: `data.attributes.spelldc`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: tactor.data.data.attributes.spelldc, priority: 20 },
            { key: "flags.midi-qol.fail.ability.save.str", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, },
            { key: "flags.midi-qol.fail.ability.save.dex", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, },
            { key: "flags.midi-qol.superSaver.con", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, },
            { key: "flags.midi-qol.superSaver.int", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, },
            { key: "flags.midi-qol.superSaver.wis", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, },
            { key: "flags.midi-qol.superSaver.cha", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, },
        ],
        label: "Arcane Hand",
        disabled: false,
        icon: "systems/dnd5e/icons/spells/fireball-eerie-3.jpg"
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: spawnedTokenDoc.actor.uuid, effects: [effectData] });
};

if (args[0] === "on") {
    let updates = {
        token: { "name": `Arcane Hand (${tactor.name})` },
        actor: { 
            "name": `Arcane Hand (${tactor.name})`, 
            "data.attributes.hp.value": tactor.data.data.attributes.hp.max,
            "data.attributes.hp.max": tactor.data.data.attributes.hp.max,
        },
        embedded: {
            Item: {
                "Clenched Fist": {
                    "data.attackBonus": `${bonus - 10}`,
                    "data.damage.parts": [[`4d8 + ${(spellLevel - 5) * 2}d8`, "force"]],
                },
                "Grasping Hand (Crush)": {
                    "data.damage.parts": [[`2d6 + ${(spellLevel - 5) * 2}d6 + @flags.spellmod`, "force"]],
                },
            }
        }
    };
    
    await warpgate.spawn("Arcane Hand", updates, { post: postWarp }, {});
};