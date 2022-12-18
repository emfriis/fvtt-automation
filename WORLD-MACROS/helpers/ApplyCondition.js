// apply condition macro
// execute as gm
// args: 
// [1] - target tokenUuid (string: [tokenUuid] or "self")
// [2] - condition application type (string: "other" or "save")
// [3] - condition name (string: i.e., "Prone", "Stunned")
// [4] - save dc (int: i.e., 10, 15, ...)
// [5] - save type (string: i.e., "dex", "wis", ...)
// [6] - duration seconds (int: i.e, 60, 600, ... or "" or EMPTY)
// [7] - duration special (string: i.e., "isDamaged", "1Attack", ... or "" or EMPTY)
// [8] - magic effect (string: "magiceffect" or "" or EMPTY)
// [9] - spell effect (string: "spelleffect" or "" or EMPTY)
// [10] - attempt removal data (string: i.e., "10,save,con,auto", "12,abil,str,opt", ... or "" or EMPTY)
// [11] - attempt removal timing (string: i.e., "startEveryTurn" or "endEveryTurn" or "" or EMPTY)
// [12] - origin uuid (string: [uuid] or "" or EMPTY)
// [13] - on/off override (string: "on", "off", or "" or EMPTY)

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

    if (args[0] === "on" && args[13] !== "on") return;
    if (args[0] === "off" && args[13] !== "off") return;

    let targetId;
    if (args[1] === "self") {
        targetUuid = lastArg.tokenId;
    } else {
        targetId = args[1];
    }
    const targetToken = canvas.tokens.get(targetId)
    const targetTactor = targetToken.actor;
    const getResist = targetTactor.data.flags["midi-qol"]?.resilience[args[3].toLowerCase()] || (args[8] === "magiceffect" && targetTactor.data.flags["midi-qol"]?.magicResistance && (targetTactor.data.flags["midi-qol"]?.magicResistance?.all || targetTactor.data.flags["midi-qol"]?.magicResistance[args[5]])) || (args[9] === "spelleffect" && targetTactor.data.flags["midi-qol"].spellResistance);
    const targetPlayer = await playerForActor(targetTactor);
    const rollOptions = getResist ? { chatMessage: true, fastForward: true, advantage: true } : { chatMessage: true, fastForward: true };
    const roll = await MidiQOL.socket().executeAsUser("rollAbility", targetPlayer.id, { request: "save", targetUuid: targetTactor.uuid, ability: args[5], options: rollOptions }); 
    if (game.dice3d) game.dice3d.showForRoll(roll);
    if (roll.total < args[4]) {
        const effectData = {
            changes: [
                { key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `Convenient Effect: ${args[3]}`, priority: 20, }
            ],
            duration: null,
            disabled: false,
            origin: (args[12] ?? null),
            flags: { dae: { macroRepeat: null, specialDuration: null }, magiceffect: args[8] ?? false, spelleffect: args[9] ?? false, }
        }
        if (args[6]) effectData.duration = { seconds: args[6] };
        if (args[7]) effectData.flags.dae.specialDuration = [args[7]];
        if (args[10]) {
            effectData.changes.push({ key: "macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `AttemptRemoval ${args[10].replaceAll(",", " ")}`, priority: 20, });
            if (args[11]) effectData.flags.dae.macroRepeat = args[11];
        }
        await targetTactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    }
} catch (err) {
    console.error("ApplyCondition error", err);
}

