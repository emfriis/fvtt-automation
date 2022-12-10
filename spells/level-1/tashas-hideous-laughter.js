// tasha's hideous laughter

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const targetActor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const targetToken = await fromUuid(lastArg.tokenUuid);

const DAEItem = lastArg.efData.flags.dae.itemData;
const saveData = DAEItem.data.save;
const flavor = `${CONFIG.DND5E.abilities["wis"]} DC${saveData.dc} ${DAEItem?.name || ""}`;

async function cleanUp() {
  // remove hook
  const flag = await DAE.getFlag(targetActor, "hideousLaughterHook");
  if (flag) {
    Hooks.off("preUpdateActor", flag);
    await DAE.unsetFlag(targetActor, "hideousLaughterHook");
  }
  // remove effect
  await targetActor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
}

async function onDamageHook(hookActor, update, options, userId) {
  const flag = await DAE.getFlag(hookActor, "hideousLaughterHook");
  if (!"actorData.data.attributes.hp" in update || !flag) return;
  const oldHP = hookActor.data.data.attributes.hp.value;
  const newHP = getProperty(update, "data.attributes.hp.value");
  const hpChange = oldHP - newHP;
  if (hpChange > 0 && typeof hpChange === "number") {
    console.warn("hookActor", hookActor);
    const saveActor = game.actors.get(hookActor.id);
    const saveRoll = await saveActor.rollAbilitySave(saveData.ability, {
      flavor,
      fastForward: true,
      advantage: true,
    });
    if (saveRoll.total >= saveData.dc) {
      await cleanUp();
    }
  }
}

if (args[0] === "on") {
  if (targetActor.data.data.abilities.int.value < 4) {
    await cleanUp();
  } else {
    if (!actor.effects.find(i => i.data.label === "Prone")) {
		let effectData = {
			label: "Prone",
			icon: "icons/svg/falling.svg",
			origin: args[0].uuid,
			disabled: false,
			changes: [{ key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Prone", priority: 20 }]
		};
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [effectData] });
	};
    const hookId = Hooks.on("preUpdateActor", onDamageHook);
    await DAE.setFlag(targetActor, "hideousLaughterHook", hookId);
  }
}

if (args[0] === "off") {
  await cleanUp();
}

if (args[0] === "each") {
  const saveRoll = await targetActor.rollAbilitySave(saveData.ability, { flavor });
  if (saveRoll.total >= saveData.dc) {
    await cleanUp();
  }
}