// apply damage macro
// execute as gm
// args: 
// [1] - source tokenId (string: [tokenId] or "self")
// [2] - target tokenId (string: [tokenId] or "self")
// [3] - damage rollable (string: i.e., "2d6", "5", ...)
// [4] - damage type (string: i.e., "cold", "fire", ...)
// [5] - magic effect (string: "magiceffect" or "no" or EMPTY)
// [6] - spell effect (string: "spelleffect" or "no" or EMPTY)
// [7] - save dc (int: i.e., 10, 15, ... or EMPTY)
// [8] - save type (string: i.e., "dex", "wis", ... or EMPTY)
// [9] - save damage (string: "fulldam", "halfdam", "nodam", or EMPTY)
// [10] - on/off override (string: "on", "off", or EMPTY)

try {
    const lastArg = args[args.length - 1];

    if (args[0] === "on" && args[10] !== "on") return;
    if (args[0] === "off" && args[10] !== "off") return;

    let sourceId;
    if (args[1] === "self") {
        sourceId = lastArg.tokenId;
    } else {
        sourceId = args[1];
    }
    const sourceToken = canvas.tokens.get(sourceId);
    const sourceTactor = sourceToken.actor;

    let targetId;
    if (args[2] === "self") {
        targetId = lastArg.tokenId;
    } else {
        targetId = args[2];
    }
    const targetToken = canvas.tokens.get(targetId);
    const targetUuid = targetToken.document.uuid;

    const itemData = {
        name: `${args[4].charAt(0).toUpperCase() + args[4].slice(1)}`,
        img: "icons/svg/fire.svg",
        type: "feat",
        flags: {
            midiProperties: {
                magicdam: (args[5] === "magiceffect" || args[6] === "spelleffect" ? true : false),
                magiceffect: (args[5] === "magiceffect" ? true : false),
                spelleffect: (args[6] === "spelleffect" ? true : false),
                fulldam: (args[9] === "fulldam" ? true : false),
                halfdam: (args[9] === "halfdam" ? true : false),
                nodam: (args[9] === "nodam" ? true : false)
            }
        },
        data: {
            activation: {
                type: "none"
            },
            actionType: (parseInt(args[7]) ? "save" : "other"),
            target: { value: null, type: sourceId === targetId ? "self" : "creature" },
            damage: { parts: [[args[3] + `[${args[4]}]`, args[4]]] },
            save: { dc: args[7], ability: args[8], scaling: "flat" },
        }
    }
    await sourceTactor.createEmbeddedDocuments("Item", [itemData]);
    let damageItem = sourceTactor.items.find(i => i.name === itemData.name);
    let hook = Hooks.on("midi-qol.preambleComplete", async (workflowNext) => {
        if (workflowNext.uuid === damageItem.uuid) {
            workflowNext.targets.add(targetToken);
            Hooks.off("midi-qol.preambleComplete", hook);
        }
    });
    await MidiQOL.completeItemRoll(damageItem, { targetUuids: [targetUuid] });
    await sourceTactor.deleteEmbeddedDocuments("Item", [damageItem.id]);
} catch (err) {
    console.error("ApplyDamage error", err);
    try {
        let sourceId;
        if (args[1] === "self") {
            sourceId = lastArg.tokenId;
        } else {
            sourceId = args[1];
        }
        const sourceToken = canvas.tokens.get(sourceId);
        const sourceTactor = sourceToken.actor;
        let damageItem = await sourceTactor.items.find(i => i.name === `${args[4].charAt(0).toUpperCase() + args[4].slice(1)}`);
        await sourceTactor.deleteEmbeddedDocuments("Item", [damageItem.id]);
    } catch (err) {
        console.error("ApplyDamage error Cleanup error", err);
    }
}