// summon shadowspawn
// effect itemacro

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const spellLevel = args[1];
const bonus = tactor.data.data.attributes.prof + tactor.data.data.abilities[tactor.data.data.attributes.spellcasting]?.mod ?? tactor.data.data.abilities.int.mod;

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Summon Shadowspawn");
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
        label: "Summon Shadowspawn",
        disabled: false,
        icon: "icons/creatures/magical/spirit-undead-winged-ghost.webp"
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: spawnedTokenDoc.actor.uuid, effects: [effectData] });
    let despairItem = spawnedTokenDoc.actor.items.find(i => i.name === "Weight of Sorrow");
    let fearItem = spawnedTokenDoc.actor.items.find(i => i.name === "Shadow Stealth");
    let furyItem = spawnedTokenDoc.actor.items.find(i => i.name === "Terror Frenzy");
    await new Promise((resolve, reject) => {
        new Dialog({
            title: "Summon Shadowspawn",
            content: "Choose an emotion",
            buttons: {
                Fury: {
                    label: "Fury",
                    callback: async () => {
                        await spawnedTokenDoc.actor.deleteEmbeddedDocuments("Item", [despairItem.id, fearItem.id]);
                    },
                },
                Despair: {
                    label: "Despair",
                    callback: async () => {
                        await spawnedTokenDoc.actor.deleteEmbeddedDocuments("Item", [furyItem.id, fearItem.id]);
                    },
                },
                Fear: {
                    label: "Fear",
                    callback: async () => {
                        await spawnedTokenDoc.actor.deleteEmbeddedDocuments("Item", [despairItem.id, furyItem.id]);
                    },
                },
            },
            default: "Fury",
            close: () => {resolve(false)}
        }).render(true);
    });
}

if (args[0] === "on") {
    let updates = {
        token: { 
            "name": `Shadow Spirit (${tactor.name})`, 
            "disposition": token.data.disposition,
        },
        actor: { 
            "name": `Shadow Spirit (${tactor.name})`, 
            "data": { 
                "attributes": {
                    "hp": {
                        "value": spellLevel * 15 - 10,
                        "max": spellLevel * 15 - 10
                    },
                    "ac": {
                        "value": 11 + spellLevel,
                    }
                }
            }
        },
        embedded: {
            Item: {
                "Chilling Rend": {
                    "data.attackBonus": `${bonus - 3}`,
                    "data.damage.parts": [[`1d12 + 3 + ${spellLevel}`, "cold"]],
                }
            }
        }
    }
    await warpgate.spawn("Summon Shadowspawn", updates, { post: postWarp }, {});
}