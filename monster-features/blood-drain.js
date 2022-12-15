// blood drain
// on use
// effect itemacro

function playerForActor(actor) {
    if (!actor) return undefined;
    let user;
    if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
    if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
    if (!user) user = game.users?.find(p => p.isGM && p.active);
    return user;
}

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function attemptRemoval() {
    const tokenOrActorSource = await fromUuid(args[1]);
    const tactorSource = tokenOrActorSource.actor ? tokenOrActorSource.actor : tokenOrActorSource;

    if (tactor === tactorSource) {
        const tokenTarget = canvas.tokens.get(args[2]);
        const sourceItem = await fromUuid(lastArg.efData.origin);
        const damageRoll = await new Roll(`1d4 + 3`).evaluate({ async: true });
        if (game.dice3d) game.dice3d.showForRoll(damageRoll);
        const workflowItemData = duplicate(sourceItem.data);
        workflowItemData.data.target = { value: 1, units: "", type: "creature" };
        workflowItemData.name = "Blood Drain";

        await new MidiQOL.DamageOnlyWorkflow(
            tactor,
            token.data,
            damageRoll.total,
            "",
            [tokenTarget],
            damageRoll,
            {
              flavor: "Blood Drain",
              itemCardId: "new",
              itemData: workflowItemData,
              isCritical: false,
            }
        );

        const flag = await DAE.getFlag(tactor, "bloodDrain");
	    if (flag) {
            if (flag + damageRoll.total >= 10) {
                let drain = tactorSource.effects.find(i => i.data.label === "Blood Drain Attached");
		        if (drain) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactorSource.uuid, effects: [drain.id] });
                await DAE.unsetFlag(tactorSource, "bloodDrain");
                return;
            }
            await DAE.setFlag(tactor, "bloodDrain", flag + damageRoll.total);
        } else {
            await DAE.setFlag(tactor, "bloodDrain", damageRoll.total);
        }
    }

    const player = await playerForActor(tactor);
    const socket = socketlib.registerModule("user-socket-functions");
    let attempt = false;
    if (socket) attempt = await socket.executeAsUser("useDialog", player.id, { title: `Use action to remove Blood Drain?`, content: `` });
    if (attempt) {
        let drain = tactorSource.effects.find(i => i.data.label === "Blood Drain Attached");
        if (drain) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactorSource.uuid, effects: [drain.id] });
        await DAE.unsetFlag(tactorSource, "drain");
    }
}

if (args[0].tag === "OnUse" && lastArg.hitTargetUuids.length > 0) {
    const tokenIdTarget = lastArg.hitTargets[0].id ?? lastArg.hitTargets[0]._id;
    const tokenOrActorTarget = await fromUuid(lastArg.hitTargetUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;      
    const effectData = {
        changes: [
            { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `${tokenOrActor.uuid} ${tokenIdTarget}`, priority: 20 },
        ],
        disabled: false,
        origin: lastArg.item.uuid,
        flags: { 
            dae: { macroRepeat: "startEveryTurn" },
            core: { statusId: "Blood Drain" } 
        },
        icon: lastArg.item.img,
        label: "Blood Drain"
    };
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });

    let drain = await tactorTarget.effects.find(i => i.data.label === "Blood Drain");

    const effectData2 = {
        changes: [
            { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `${tokenOrActor.uuid} ${tokenIdTarget}`, priority: 20 },
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: drain.uuid, priority: 20 }
        ],
        disabled: false,
        origin: lastArg.item.uuid,
        flags: { 
            dae: { macroRepeat: "startEveryTurn" },
            core: { statusId: "Blood Drain Attached" } 
        },
        icon: lastArg.item.img,
        label: "Blood Drain Attached"
    };
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData2] });
}

if (args[0] === "each") {
    attemptRemoval();
}

if (args[0] === "off") {
    const flag = await DAE.getFlag(tactor, "bloodDrain");
	if (flag) {
        await DAE.unsetFlag(tactor, "bloodDrain");
    }
}