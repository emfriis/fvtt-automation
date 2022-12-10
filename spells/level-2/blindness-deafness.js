// blindness/deafness
  
const lastArg = args[args.length - 1];
const token = await fromUuid(lastArg.tokenUuid);
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

if (args[0] === "on") {
  const sourceItem = await fromUuid(lastArg.efData.origin);
  const sourceActor = sourceItem.parent;
  let player = await playerForActor(sourceActor);
  let socket = socketlib.registerModule("user-socket-functions");
  let deafen = false;
  if (player && socket) reduce = await socket.executeAsUser("useDialog", player.id, { title: `Blindness/Deafness`, content: `Apply Deafened instead of Blinded?` });
  if (deafen) {
    DAE.setFlag(tactor, "DAEBlind", "deaf");
    const effectData = {
      changes: [
        { key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99, value: "Convenient Effect: Deafened", },
      ],
      origin: lastArg.uuid,
      disabled: false,
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
  } else {
    DAE.setFlag(tactor, "DAEBlind", "blind");
    const senses = tactor.data.data.attributes.senses;
    let visionRange = Math.max(senses.blindsight, senses.tremorsense, 0);
    const effectData = {
      changes: [
        { key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "Convenient Effect: Blinded", },
        { key: "ATL.flags.perfect-vision.sightLimit", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 99 - visionRange, value: `[[Math.max(@attributes.senses.blindsight, @attributes.senses.tremorsense, 0)]]`, },
        { key: "ATCV.blinded", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "1", },
        { key: "ATCV.conditionType", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "sense", },
        { key: "ATCV.conditionBlinded", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "true", },
        { key: "ATCV.conditionTargets", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "", },
        { key: "ATCV.conditionSources", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, priority: 99 - visionRange, value: "", },
      ],
      origin: lastArg.uuid,
      disabled: false,
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
  }
}
  
if (args[0] === "off") {
  let flag = DAE.getFlag(tactor, "DAEBlind");
  if (flag === "blind") {
    let blind = tactor.effects.find(i => i.data.label === "Blinded" && i.data.origin === lastArg.uuid);
    if (blind) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [blind.id] });
  } else if (flag === "deaf") {
    let deaf = tactor.effects.find(i => i.data.label === "Deafened" && i.data.origin === lastArg.uuid);
    if (deaf) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [deaf.id] });
  }
  DAE.unsetFlag(tactor, "DAEBlind");
}