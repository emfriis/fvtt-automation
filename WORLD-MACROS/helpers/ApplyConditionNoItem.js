// apply condition macro
// execute as gm
// args: 
// [1] - target tokenUuid (string: [tokenUuid] or "self")
// [2] - condition name (string: i.e., "Prone", "Stunned")
// [3] - save dc (int: i.e., 10, 15, ...)
// [4] - save type (string: i.e., "dex", "wis", ...)
// [5] - duration seconds (int: i.e, 60, 600, ... or "" or EMPTY)
// [6] - duration special (string: i.e., "isDamaged", "1Attack", ... or "" or EMPTY)
// [7] - magic effect (string: "magiceffect" or "" or EMPTY)
// [8] - spell effect (string: "spelleffect" or "" or EMPTY)
// [9] - attempt removal data (string: i.e., "10,save,con,auto", "12,abil,str,opt", ... or "" or EMPTY)
// [10] - attempt removal timing (string: i.e., "startEveryTurn" or "endEveryTurn" or "" or EMPTY)
// [11] - origin uuid (string: [uuid] or "" or EMPTY)
// [12] - on/off override (string: "on", "off", or "" or EMPTY)

try {
    const lastArg = args[args.length - 1];
    
    async function playerForActor(actor) {
        if (!actor) return undefined;
        let user;
        if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
        if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
        if (!user) user = game.users?.find(p => p.isGM && p.active);
        return user;
    }

    if (args[0] === "on" && args[12] !== "on") return;
    if (args[0] === "off" && args[12] !== "off") return;

    let targetId;
    if (args[1] === "self") {
        targetUuid = lastArg.tokenId;
    } else {
        targetId = args[1];
    }
    const targetToken = canvas.tokens.get(targetId);
    const targetTactor = targetToken.actor;
    
    let roll;
    if (args[3]) {
        let conditionResist = targetTactor.data.flags["midi-qol"]?.resilience && targetTactor.data.flags["midi-qol"]?.resilience[condition.toLowerCase()];
        let magicResist = args[7] === "magiceffect" && ((targetTactor.data.flags["midi-qol"]?.magicResistance?.all && typeof(targetTactor.data.flags["midi-qol"]?.magicResistance?.all) !== "object") || targetTactor.data.flags["midi-qol"]?.magicResistance?.all[args[2]]);
        let spellResist = args[8] === "spelleffect" && targetTactor.data.flags["midi-qol"]?.spellResistance?.save;
        const getResist = conditionResist || magicResist || spellResist;
        const targetPlayer = await playerForActor(targetTactor);
        const rollOptions = getResist ? { chatMessage: true, fastForward: true, advantage: true } : { chatMessage: true, fastForward: true };
        roll = await MidiQOL.socket().executeAsUser("rollAbility", targetPlayer.id, { request: "save", targetUuid: targetTactor.uuid, ability: args[5], options: rollOptions }); 
        if (game.dice3d) game.dice3d.showForRoll(roll);
    }

    if (!args[3] || roll?.total >= args[3]) return;
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
    await targetTactor.createEmbeddedDocuments("ActiveEffect", [effectData]);

} catch (err) {
    console.error("ApplyCondition error", err);
}

