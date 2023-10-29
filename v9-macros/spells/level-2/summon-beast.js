// summon beast
// effect itemacro

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const spellLevel = args[1];
const bonus = tactor.data.data.attributes.prof + (tactor.data.data.abilities[tactor.data.data.attributes.spellcasting]?.mod ?? tactor.data.data.abilities.int.mod);

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Summon Beast");
    let summonUuid = spawnedTokenDoc.uuid;
    if (ef) {
        let changes = [{ key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: summonUuid, priority: 20, }];
        await ef.update({ changes: changes.concat(ef.data.changes) });
    }
    let effectData = {
        changes: [
            { key: "flags.parent", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.tokenId, priority: 20, },
            { key: "ATL.disposition", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: token.data.disposition, priority: 20, },
            { key: `data.attributes.spelldc`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: tactor.data.data.attributes.spelldc, priority: 20 },
        ],
        label: "Summon Beast",
        disabled: false,
        icon: "icons/creatures/mammals/spirit-deer-herd-blue.webp"
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: spawnedTokenDoc.actor.uuid, effects: [effectData] });
    let packEffect = spawnedTokenDoc.actor.effects.find(e => e.data.label === "Pack Tactics");
    let packItem = spawnedTokenDoc.actor.items.find(i => i.name === "Pack Tactics");
    let waterItem = spawnedTokenDoc.actor.items.find(i => i.name === "Water Breathing");
    let flyItem = spawnedTokenDoc.actor.items.find(i => i.name === "Flyby");
    await new Promise((resolve, reject) => {
        new Dialog({
            title: "Summon Beast",
            content: "Choose an environment",
            buttons: {
                Air: {
                    label: "Air",
                    callback: async () => {
                        await spawnedTokenDoc.actor.deleteEmbeddedDocuments("ActiveEffect", [packEffect.id]);
                        await spawnedTokenDoc.actor.deleteEmbeddedDocuments("Item", [packItem.id, waterItem.id]);
                        await spawnedTokenDoc.actor.update({ "data.attributes.hp.value": 20 + 5 * (spellLevel - 2), "data.attributes.hp.max": 20 + 5 * (spellLevel - 2), "data.attributes.hp.max": 20 + 5 * (spellLevel - 2), "data.attributes.movement.fly": 60 });
                    },
                },
                Land: {
                    label: "Land",
                    callback: async () => {
                        await spawnedTokenDoc.actor.deleteEmbeddedDocuments("Item", [waterItem.id, flyItem.id]);
                        await spawnedTokenDoc.actor.update({ "data.attributes.hp.value": 30 + 5 * (spellLevel - 2), "data.attributes.hp.max": 30 + 5 * (spellLevel - 2), "data.attributes.hp.max": 30 + 5 * (spellLevel - 2), "data.attributes.movement.climb": 30 });
                    },
                },
                Water: {
                    label: "Water",
                    callback: async () => {
                        await spawnedTokenDoc.actor.deleteEmbeddedDocuments("Item", [flyItem.id]);
                        await spawnedTokenDoc.actor.update({ "data.attributes.hp.value": 30 + 5 * (spellLevel - 2), "data.attributes.hp.max": 30 + 5 * (spellLevel - 2), "data.attributes.hp.max": 30 + 5 * (spellLevel - 2), "data.attributes.movement.swim": 30 });
                    },
                },
            },
            default: "Air",
            close: () => {resolve(false)}
        }).render(true);
    });
}

if (args[0] === "on") {
    let updates = {
        token: { 
            "name": `Beast Spirit (${tactor.name})`, 
            "disposition": token.data.disposition,
        },
        actor: { 
            "name": `Beast Spirit (${tactor.name})`, 
            "data": { 
                "attributes": {
                    "ac": {
                        "value": 11 + spellLevel,
                    }
                }
            }
        },
        embedded: {
            Item: {
                "Bite": {
                    "data.attackBonus": `${bonus - 6}`,
                    "data.damage.parts": [[`1d8 + 4 + ${spellLevel}`, "piercing"]],
                }
            }
        }
    }
    await warpgate.spawn("Summon Beast", updates, { post: postWarp }, {});
}