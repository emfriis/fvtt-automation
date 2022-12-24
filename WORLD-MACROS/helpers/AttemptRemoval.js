// attempt removal macro
// execute as gm
// values : dc(int) type(string) abil/save(string) auto/opt(string)

try {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

    function playerForActor(actor) {
        if (!actor) return undefined;
        let user;
        if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
        if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
        if (!user) user = game.users?.find(p => p.isGM && p.active);
        return user;
    }

    if (args[0] === "each" && lastArg.efData.disabled === false) {
        const origin = await fromUuid(lastArg.efData.origin);
        const condition = lastArg.efData.label;
        const player = await playerForActor(tactor);
        const saveDC = args[1];
        const ability = args[2];
        const type = args[3];
        let getResist = false;
        if (type === "save") {
            let conditionResist = tactor.data.flags["midi-qol"]?.resilience && tactor.data.flags["midi-qol"]?.resilience[condition.toLowerCase()];
            let magicResist = (origin?.data?.data?.properties?.mgc || origin?.data?.flags?.midiProperties?.magiceffect || lastArg.efData?.flags?.magiceffect) && ((tactor.data.flags["midi-qol"]?.magicResistance?.all && typeof(tactor.data.flags["midi-qol"]?.magicResistance?.all) !== "object") || tactor.data.flags["midi-qol"]?.magicResistance?.all[args[2]]);
            let spellResist = (origin?.data?.type === "spell" || lastArg.efData?.flags?.spelleffect) && tactor.data.flags["midi-qol"]?.spellResistance?.save;
            getResist = conditionResist || magicResist || spellResist;
        }
        let options = getResist ? { chatMessage: true, fastForward: true, advantage: true } : { chatMessage: true, fastForward: true }
        let attempt = false;
        if (args[4] === "opt") {
            const socket = socketlib.registerModule("user-socket-functions");
            if (socket) attempt = await socket.executeAsUser("useDialog", player.id, { title: `Use action to attempt to remove ${condition}?`, content: `` });
        }
        if (args[4] === "auto" || attempt) {
            const roll = await MidiQOL.socket().executeAsUser("rollAbility", player.id, { request: type, targetUuid: tactor.uuid, ability: ability, options: options });
            if (game.dice3d) game.dice3d.showForRoll(roll);
            if (roll.total >= saveDC) {
                let ef = tactor.effects.find(i => i.data === lastArg.efData);
                if (ef) await tactor.deleteEmbeddedDocuments("ActiveEffect", [ef.id]);
                ChatMessage.create({ content: `The afflicted creature passes the roll and removes the ${condition} condition.` });
            } else {
                if (roll.total < saveDC) ChatMessage.create({ content: `The afflicted creature fails the roll and still has the ${condition} condition.` });
            }
        }
    }
} catch (err) {
    console.error("AttemptRemoval error", err);
}