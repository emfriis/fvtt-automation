// custom spiritual weapon
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const spellLevel = args[1];
const bonus = tactor.data.data.attributes.prof + tactor.data.data.abilities[tactor.data.data.attributes.spellcasting].mod;

const customImgPath = "modules/jb2a_patreon-2d960ceba80cc778/assets/Library/2nd_Level/Spiritual_Weapon/SpiritualWeapon_Sword01_01_Spectral_Green_200x200.webm";

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Spiritual Weapon");
    let summonUuid = spawnedTokenDoc.uuid;
    if (ef) {
        let changes = [{ key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: summonUuid, priority: 20, }];
        await ef.update({ changes: changes.concat(ef.data.changes) });
    };
    let effectData = {
        changes: [{ key: "flags.parent", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.tokenId, priority: 20, }],
        label: "Spiritual Weapon",
        disabled: false,
        icon: "icons/magic/fire/dagger-rune-enchant-flame-blue-yellow.webp"
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: spawnedTokenDoc.actor.uuid, effects: [effectData] });
};

if (args[0] === "on") {
    let updates = {
        token: { "name": `Spiritual Weapon (${tactor.name})`, "img": customImgPath },
        actor: { "name": `Spiritual Weapon (${tactor.name})` },
        embedded: {
            Item: {
                "Spiritual Weapon Attack": {
                    "data.attackBonus": bonus,
                    "data.damage.parts": [[`${Math.max(Math.floor(spellLevel / 2), 1)}d8`, "force"]],
                    "flags.midiProperties.spelleffect": true,
                },
            },
        },
    };
    await warpgate.spawn("Spiritual Weapon", updates, { post: postWarp }, {});
};