// apply condition macro
// execute as gm
// args: 
// [1] - target tokenId (string: [tokenUuid] or "self")
// [2] - condition name (string: i.e., "Prone", "Stunned")
// [3] - save dc (int: i.e., 10, 15, ...)
// [4] - save type (string: i.e., "dex", "wis", ...)
// [5] - duration seconds (int: i.e, 60, 600, ... or "" or EMPTY)
// [6] - duration special (string: i.e., "isDamaged", "1Attack", ... or "" or EMPTY [comma separated])
// [7] - magic effect (string: "magiceffect" or "" or EMPTY)
// [8] - spell effect (string: "spelleffect" or "" or EMPTY)
// [9] - attempt removal data (string: i.e., "10,save,con,auto", "12,abil,str,opt", ... or "" or EMPTY)
// [10] - attempt removal timing (string: i.e., "startEveryTurn" or "endEveryTurn" or "" or EMPTY)
// [11] - origin uuid (string: [uuid] or "" or EMPTY)
// [12] - on/off override (string: "on", "off", or "" or EMPTY)

try {
    const lastArg = args[args.length - 1];

    if (args[0] === "on" && args[12] !== "on") return;
    if (args[0] === "off" && args[12] !== "off") return;

    let targetId;
    if (args[1] === "self") {
        targetId = lastArg.tokenId;
    } else {
        targetId = args[1];
    }
    const targetToken = canvas.tokens.get(targetId);
    const tactor = targetToken.actor;
    if (!tactor) return;

    const itemData = {
        name: `${args[2].charAt(0).toUpperCase() + args[2].slice(1)} Save`,
        img: `icons/svg/aura.svg`,
        type: "feat",
        flags: {
            midiProperties: { magiceffect: (args[7] === "magiceffect" ? true : false), spelleffect: (args[8] === "spelleffect" ? true : false), }
        },
        data: {
            activation: { type: "none", },
            target: { type: "self", },
            actionType: "save",
            save: { dc: args[3], ability: args[4], scaling: "flat" },
        }
    }
    let saveItem = new CONFIG.Item.documentClass(itemData, { parent: tactor });
    let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
    
    if (saveWorkflow.failedSaves.size) {
        const effectData = {
            changes: [
                { key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `Convenient Effect: ${args[2]}`, priority: 20, },
                { key: args[9] ? "macro.execute" : null, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: args[9] ? `AttemptRemoval ${args[9].replaceAll(",", " ")}` : null, priority: 20, },
            ],
            duration: { seconds: args[5] ?? null },
            disabled: false,
            origin: (args[11] ?? null),
            flags: { dae: { macroRepeat: args[10] ?? null, specialDuration: args[6]?.split(",") ?? null }, magiceffect: args[7] ?? false, spelleffect: args[8] ?? false, },
        }
        await tactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    }
} catch (err) {
    console.error("ApplyCondition error", err);
}

