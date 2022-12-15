// enlarge reduce
// on use pre saves
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const token = canvas.tokens.get(lastArg.tokenId);

function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0 && args[0].macroPass === "preSave") {
    for (let i = 0; i < lastArg.targetUuids.length; i++) {
        let tokenOrActorTarget = await fromUuid(lastArg.targetUuids[i]);
        let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
        if (tactor.token?.data?.disposition === tactorTarget.token?.data?.disposition) {
            const effectData = {
                changes: [
                    {
                        key: "data.bonuses.abilities.save",
                        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                        value: -999,
                        priority: 20,
                    }
                ],
                disabled: false,
                flags: { dae: { specialDuration: ["isSave"] } },
                icon: args[0].item.img,
                label: `${args[0].item.name} Save Auto Fail`,
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
        }
    }
}

async function reSize(flavour) {
    const originalSizeType = tactor.data.data.traits.size;
    const sizeTypes = {
        grg: { enlarge: "grg", reduce: "huge", },
        huge: { enlarge: "grg", reduce: "lg", },
        lg: { enlarge: "huge", reduce: "med", },
        med: { enlarge: "lg", reduce: "sm", },
        sm: { enlarge: "med", reduce: "tiny", },
        tiny: { enlarge: "sm", reduce: "tiny", },
    }
    const originalSize = parseInt(token?.data?.width);
    const types = {
        enlarge: {
            size: originalSizeType === "sm" ? originalSize : originalSize + 1,
            bonus: "+1d4",
            sizeType: sizeTypes[`${originalSizeType}`].enlarge,
        },
        reduce: {
            size: originalSize > 1 ? originalSize - 1 : originalSize - 0.3,
            bonus: "-1d4",
            sizeType: sizeTypes[`${originalSizeType}`].reduce,
        },
    }
    const changes = [
        {
            key: "data.bonuses.mwak.damage",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            priority: 20,
            value: `${types[flavour].bonus}`,
        },
        {
            key: "ATL.width",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 30,
            value: `${types[flavour].size}`,
        },
        {
            key: "ATL.height",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 30,
            value: `${types[flavour].size}`,
        },
        {
            key: "data.traits.size",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 20,
            value: `${types[flavour].sizeType}`,
        },
    ];
    const effect = tactor.effects.find((e) => e.data.label === lastArg.efData.label);
    if (effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: effect.id, changes: changes.concat(effect.data.changes) }] });
}

if (args[0] === "on") {
    const sourceItem = await fromUuid(lastArg.efData.origin);
    const sourceActor = sourceItem.parent;
    let player = await playerForActor(sourceActor);
    let socket = socketlib.registerModule("user-socket-functions");
    let reduce = false;
    if (player && socket) reduce = await socket.executeAsUser("useDialog", player.id, { title: `Enlarge/Reduce`, content: `Reduce instead of Enlarge?` });
    if (reduce) {
        await reSize("reduce");
    } else {
        await reSize("enlarge");
    }
}