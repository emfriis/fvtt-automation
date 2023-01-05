// summon fey
// effect itemacro

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const spellLevel = args[1];
const bonus = tactor.data.data.attributes.prof + (tactor.data.data.abilities[tactor.data.data.attributes.spellcasting]?.mod ?? tactor.data.data.abilities.int.mod);

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Summon Fey");
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
        label: "Summon Fey",
        disabled: false,
        icon: "icons/creatures/magical/humanoid-silhouette-green.webp"
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: spawnedTokenDoc.actor.uuid, effects: [effectData] });
    let fumingItem = spawnedTokenDoc.actor.items.find(i => i.name === "Fuming");
    let mirthfulItem = spawnedTokenDoc.actor.items.find(i => i.name === "Mirthful");
    let tricksyItem = spawnedTokenDoc.actor.items.find(i => i.name === "Tricksy");
    await new Promise((resolve, reject) => {
        new Dialog({
            title: "Summon Fey",
            content: "Choose a mood",
            buttons: {
                Fuming: {
                    label: "Fuming",
                    callback: async () => {
                        await spawnedTokenDoc.actor.deleteEmbeddedDocuments("Item", [mirthfulItem.id, tricksyItem.id]);
                    },
                },
                Mirthful: {
                    label: "Mirthful",
                    callback: async () => {
                        await spawnedTokenDoc.actor.deleteEmbeddedDocuments("Item", [fumingItem.id, tricksyItem.id]);
                    },
                },
                Tricksy: {
                    label: "Tricksy",
                    callback: async () => {
                        await spawnedTokenDoc.actor.deleteEmbeddedDocuments("Item", [fumingItem.id, mirthfulItem.id]);
                    },
                },
            },
            default: "Fuming",
            close: () => {resolve(false)}
        }).render(true);
    });
}

if (args[0] === "on") {
    let updates = {
        token: { 
            "name": `Fey Spirit (${tactor.name})`, 
            "disposition": token.data.disposition,
        },
        actor: { 
            "name": `Fey Spirit (${tactor.name})`, 
            "data": { 
                "attributes": {
                    "hp": {
                        "value": spellLevel * 10,
                        "max": spellLevel * 10,
                    },
                    "ac": {
                        "value": 12 + spellLevel,
                    }
                }
            }
        },
        embedded: {
            Item: {
                "Shortsword": {
                    "data.attackBonus": `${bonus - 3}`,
                    "data.damage.parts": [[`1d6 + 3 + ${spellLevel}`, "force"]],
                }
            }
        }
    }
    await warpgate.spawn("Summon Fey", updates, { post: postWarp }, {});
}