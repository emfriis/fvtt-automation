// guardian of faith
// effect itemacro

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Guardian of Faith");
    let summonUuid = spawnedTokenDoc.uuid;
    if (ef) {
        let changes = [
            { key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: summonUuid, priority: 20, }
        ];
        await ef.update({ changes: changes.concat(ef.data.changes) });
    }
    await wait(100);
    let effectData1 = {
        changes: [
            { key: "flags.parent", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.tokenId, priority: 20, },
            { key: "data.attributes.spelldc", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: tactor.data.data.attributes.spelldc, priority: 20 },
        ],
        label: "Guardian of Faith",
        disabled: false,
        icon: "icons/magic/light/explosion-star-glow-orange.webp"
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: spawnedTokenDoc.actor.uuid, effects: [effectData1] });
    let effectData2 = {
        changes: [
            { key: "macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `GuardianOfFaith ${spawnedTokenDoc.id}`, priority: 20 },
        ],
        label: "Guardian of Faith Aura",
        disabled: false,
        icon: "icons/magic/light/explosion-star-glow-orange.webp",
        flags: {
            ActiveAuras: {
                alignment: "",
                aura: "Enemy",
                displayTemp: true,
                height: true,
                hidden: false,
                hostile: false,
                ignoreSelf: true,
                hostile: false,
                isAura: true,
                onlyOnce: false,
                radius: 15,
                type: "",
            }
        }
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: spawnedTokenDoc.actor.uuid, effects: [effectData2] });
}

if (args[0] === "on") {
    let updates = {
        token: { 
            "name": `Guardian of Faith (${tactor.name})`, 
            "disposition": token.data.disposition,
        },
        actor: {  "name": `Guardian of Faith (${tactor.name})`, },
    }
    await warpgate.spawn("Guardian of Faith", updates, { post: postWarp }, {});
}