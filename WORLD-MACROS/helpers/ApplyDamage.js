// apply damage macro
// execute as gm
// args: 
// [1] - source actorUuid (string: [actorUuid] or "self")
// [2] - target tokenUuid (string: [tokenUuid] or "self")
// [3] - damage rollable (string: i.e., "2d6", "5", ...)
// [4] - damage type (string: i.e., "cold", "fire", ...)
// [5] - magic effect (string: "magiceffect" or "no" or EMPTY)
// [6] - spell effect (string: "spelleffect" or "no" or EMPTY)
// [7] - save dc (int: i.e., 10, 15, ... or EMPTY)
// [8] - save type (string: i.e., "dex", "wis", ... or EMPTY)
// [9] - save damage (string: "fulldam", "halfdam", "nodam", or EMPTY)
// [10] - on/off override (string: "on", "off", or EMPTY)

try {
    if (args[0] === "on" && args[10] !== "on") return;
    if (args[0] === "off" && args[10] !== "off") return;

    const lastArg = args[args.length - 1];

    let sourceUuid;
    if (args[1] === "self") {
        sourceUuid = lastArg.actorUuid;
    } else {
        sourceUuid = args[1];
    }
    const sourceTokenOrActor = await fromUuid(sourceUuid);
    const sourceActor = sourceTokenOrActor.actor ? sourceTokenOrActor.actor : sourceTokenOrActor;

    let targetUuid;
    if (args[2] === "self") {
        targetUuid = lastArg.tokenUuid;
    } else {
        targetUuid = args[2];
    }
    const targetTokenOrActor = await fromUuid(targetUuid);
    const targetActor = targetTokenOrActor.actor ? targetTokenOrActor.actor : targetTokenOrActor;

    if (args[7]) {
        let resist = [];
        if (args[4].toLowerCase === "poison") resist.push("Dwarven Resilience", "Duergar Resilience", "Stout Resilience", "Poison Resilience");
        if (args[6] === "spelleffect") {
            resist.push("Spell Resilience", "Spell Resistance", "Magic Resilience", "Magic Resistance");
        } else if (args[5] === "magiceffect") {
            resist.push("Magic Resilience", "Magic Resistance");
        }
        const getResist = targetActor.items.find(i => resist.includes(i.name)) || targetActor.effects.find(i => resist.includes(i.data.label));
        if (getResist) {
            const effectData = {
                changes: [{ key: "flags.midi-qol.advantage.ability.save.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
                disabled: false,
                flags: { dae: { specialDuration: ["isSave"] } },
                label: "Damage Save Advantage",
            }
            await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        }
    }

    const itemData = {
        name: `${args[4].charAt(0).toUpperCase() + args[4].slice(1)} Damage`,
        img: "icons/svg/fire.svg",
        type: "feat",
        flags: {
            midiProperties: {
                magiceffect: (args[5] === "magiceffect" ? true : false),
                fulldam: (args[9] === "fulldam" ? true : false),
                halfdam: (args[9] === "halfdam" ? true : false),
                nodam: (args[9] === "nodam" ? true : false)
            }
        },
        data: {
            activation: {
                type: "none"
            },
            actionType: (args[7] ? "other" : "save"),
            damage: { parts: [[args[3] + `[${args[4]}]`, args[4]]] },
            save: { dc: args[7], ability: args[8], scaling: "flat" },
        }
    }
    await sourceActor.createEmbeddedDocuments("Item", [itemData]);
    let item = await sourceActor.items.find(i => i.name === itemData.name);
    let options = { targetUuids: [targetUuid] };
    await MidiQOL.completeItemRoll(item, options);
    await sourceActor.deleteEmbeddedDocuments("Item", [item.id]);
} catch (err) {
    console.error("ApplyDamage error", err);
    try {
        let sourceUuid;
        if (args[1] === "self") {
            sourceUuid = lastArg.actorUuid;
        } else {
            sourceUuid = args[1];
        }
        let sourceTokenOrActor = await fromUuid(sourceUuid);
        let sourceActor = sourceTokenOrActor.actor ? sourceTokenOrActor.actor : sourceTokenOrActor;
        let item = await sourceActor.items.find(i => i.name === `${args[4].charAt(0).toUpperCase() + args[4].slice(1)} Damage`);
        await sourceActor.deleteEmbeddedDocuments("Item", [item.id]);
    } catch (err) {
        console.error("ApplyDamage error Cleanup error", err);
    }
}