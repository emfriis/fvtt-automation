// attempt removal macro
// execute as gm
// values : dc(int) abil/save(string) type(string) auto/opt(string)

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

    const origin = await fromUuid(lastArg.efData.origin);
    const condition = lastArg.efData.label;
    let getResist = false;
    if (args[2] === "save") {
        let resist = [];
        switch(condition) {
            case "Blinded":
                resist.push("Blindness Resilience");
                break;
            case "Charmed": 
                resist.push("Fey Ancestry", "Duergar Reslience", "Charm Resilience");
                break;
            case "Deafened":
                resist.push("Deafness Resilience");
                break;
            case "Frightened":
                resist.push("Brave", "Fear Resilience");
                break;
            case "Grappled":
                resist.push("Grapple Resilience");
                break;
            case "Incapacitated":
                resist.push("Incapacitation Resilience");
                break;
            case "Paralyzed":
                resist.push("Duergar Resilience", "Paralysis Resilience");
                break;
            case "Poisoned":
                resist.push("Dwarven Resilience", "Duergar Resilience", "Stout Resilience", "Poison Resilience");
                break;
            case "Prone":
                resist.push("Sure-Footed", "Prone Resilience");
                break;
            case "Restrained":
                resist.push("Restraint Resilience");
                break;
            case "Stunned":
                resist.push("Stun Resilience");
        }
        if (origin?.data?.type === "spell") {
            resist.push("Spell Resilience", "Spell Resistance", "Magic Resilience", "Magic Resistance");
        } else if (origin?.data?.data?.properties?.mgc || origin?.data?.flags?.midiProperties?.magiceffect) {
            resist.push("Magic Resilience", "Magic Resistance");
        }
        getResist = tactor.items.find(i => resist.includes(i.name)) || tactor.effects.find(i => resist.includes(i.data.label));
        if (getResist) {
            const effectData = {
                changes: [{ key: "flags.midi-qol.advantage.ability.save.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
                disabled: false,
                flags: { dae: { specialDuration: ["isSave"] } },
                label: `Attempt Removal Save Advantage`,
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
        }
    }

    if (args[0] === "each" && lastArg.efData.disabled === false) {
        const player = await playerForActor(tactor);
        const saveDC = args[1];
        const ability = args[2];
        const type = args[3];
        let attempt = false;
        if (args[4] === "opt") {
            const socket = socketlib.registerModule("user-socket-functions");
            if (socket) attempt = await socket.executeAsUser("useDialog", player.id, { title: `Use action to attempt to remove ${condition}?`, content: `` });
        }
        if (args[4] === "auto" || attempt) {
            const roll = await MidiQOL.socket().executeAsUser("rollAbility", player.id, { request: type, targetUuid: tactor.uuid, ability: ability, options: { chatMessage: true, fastForward: true } });
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