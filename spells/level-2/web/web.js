// web
// effect still doesn't apply to item parent

if(!game.modules.get("ActiveAuras")?.active) {
    ui.notifications.error("ActiveAuras is not enabled");
    return;
  }
  
  const lastArg = args[args.length - 1];
  
  async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
  
  async function attemptRemoval(targetToken, condition, item) {
    if (game.dfreds.effectInterface.hasEffectApplied(condition, targetToken.uuid)) {
      new Dialog({
        title: `Use action to attempt to remove ${condition}?`,
        buttons: {
          one: {
            label: "Yes",
            callback: async () => {
              const caster = item.parent;
              const saveDc = caster.data.data.attributes.spelldc;
              const removalCheck = "str";
              const removalSave = null;
              const ability = removalCheck ? removalCheck : removalSave;
              const type = removalCheck ? "check" : "save";
              const flavor = `${condition} (via ${item.name}) : ${CONFIG.DND5E.abilities[ability]} ${type} vs DC${saveDc}`;
              const rollResult = removalCheck
                ? (await targetToken.actor.rollAbilityTest(ability, { flavor })).total
                : (await targetToken.actor.rollAbilitySave(ability, { flavor })).total;
  
              if (rollResult >= saveDc) {
                game.dfreds.effectInterface.removeEffect({ effectName: "Restrained", uuid: targetToken.uuid });
              } else {
                if (rollResult < saveDc) ChatMessage.create({ content: `${targetToken.name} fails the ${type} for ${item.name}, still has the ${condition} condition.` });
              }
            },
          },
          two: {
            label: "No",
            callback: () => {},
          },
        },
      }).render(true);
    }
  }
  
  async function applyCondition(condition, targetToken, item, itemLevel) {
    if (!game.dfreds.effectInterface.hasEffectApplied(condition, targetToken.uuid)) {
      const caster = item.parent;
      const workflowItemData = duplicate(item.data);
      workflowItemData.data.target = { value: 1, units: "", type: "creature" };
      workflowItemData.data.save.ability = "dex";
      workflowItemData.data.components.concentration = false;
      workflowItemData.data.level = itemLevel;
      workflowItemData.data.duration = { value: null, units: "inst" };
      workflowItemData.data.target = { value: null, width: null, units: "", type: "creature" };
      workflowItemData.data.preparation.mode = "atwill";
      setProperty(workflowItemData, "flags.itemacro", {});
      setProperty(workflowItemData, "flags.midi-qol", {});
      setProperty(workflowItemData, "flags.dae", {});
      setProperty(workflowItemData, "effects", []);
      delete workflowItemData._id;
      workflowItemData.name = `${workflowItemData.name}: ${item.name} Condition save`;
      // console.warn("workflowItemData", workflowItemData);
  
      const saveTargets = [...game.user?.targets].map((t) => t.id ?? t._id);
      const targetTokenId = targetToken.id ?? targetToken._id;
      game.user.updateTokenTargets([targetTokenId]);
      const saveItem = new CONFIG.Item.documentClass(workflowItemData, { parent: caster });
      const options = { showFullCard: false, createWorkflow: true, configureDialog: true };
      const result = await MidiQOL.completeItemRoll(saveItem, options);
  
      game.user.updateTokenTargets(saveTargets);
      const failedSaves = [...result.failedSaves];
      if (failedSaves.length > 0) {
        await game.dfreds.effectInterface.addEffect({ effectName: "Restrained", uuid: failedSaves[0].document.uuid });
      }
  
      return result;
    }
  }
  
  if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    const safeName = lastArg.itemData.name.replace(/\s|'|\.|’/g, "_");
    const dataTracker = {
      randomId: randomID(),
      targetUuids: lastArg.targetUuids,
      startRound: game.combat.round,
      startTurn: game.combat.turn,
      spellLevel: lastArg.spellLevel,
    };
  
    const item = await fromUuid(lastArg.itemUuid);
    // await item.update(dataTracker);
    await DAE.unsetFlag(item, `${safeName}Tracker`);
    await DAE.setFlag(item, `${safeName}Tracker`, dataTracker);
  
  
    return await AAhelpers.applyTemplate(args);
  
  } else if (args[0] == "on" || args[0] == "each") {
    const safeName = lastArg.efData.label.replace(/\s|'|\.|’/g, "_");
    const item = await fromUuid(lastArg.efData.origin);
    // sometimes the round info has not updated, so we pause a bit
    if (args[0] == "each") await wait(500);
    const targetItemTracker = DAE.getFlag(item.parent, `${safeName}Tracker`);
    const originalTarget = targetItemTracker.targetUuids.includes(lastArg.tokenUuid);
    const target = await fromUuid(lastArg.tokenUuid);
    const targetTokenTrackerFlag = DAE.getFlag(target, `${safeName}Tracker`);
    const targetedThisCombat = targetTokenTrackerFlag && targetItemTracker.randomId === targetTokenTrackerFlag.randomId;
    const targetTokenTracker = targetedThisCombat
      ? targetTokenTrackerFlag
      : {
        randomId: targetItemTracker.randomId,
        round: game.combat.round,
        turn: game.combat.turn,
        hasLeft: false,
        condition: "Restrained",
      };
  
    const castTurn = targetItemTracker.startRound === game.combat.round && targetItemTracker.startTurn === game.combat.turn;
    const isLaterTurn = game.combat.round > targetTokenTracker.round || game.combat.turn > targetTokenTracker.turn;
    const everyEntry = false;
  
    // if:
    // not cast turn, and not part of the original target
    // AND one of the following
    // not original template and have not yet had this effect applied this combat OR
    // has been targeted this combat, left and re-entered effect, and is a later turn
  
    if (castTurn && originalTarget) {
      console.debug(`Token ${target.name} is part of the original target for ${item.name}`);
    } else if (everyEntry || !targetedThisCombat || (targetedThisCombat && isLaterTurn)) {
      console.debug(`Token ${target.name} is targeted for immediate save vs condition with ${item.name}, using the following factors`, { originalTarget, castTurn, targetedThisCombat, targetTokenTracker, isLaterTurn });
      targetTokenTracker.hasLeft = false;
      await applyCondition(targetTokenTracker.condition, target, item, targetItemTracker.spellLevel);
    }
    await DAE.setFlag(target, `${safeName}Tracker`, targetTokenTracker);
    const allowVsRemoveCondition = true;
    const effectApplied = game.dfreds.effectInterface.hasEffectApplied(targetTokenTracker.condition, target.uuid);
    const currentTokenCombatTurn = game.combat.current.tokenId === lastArg.tokenId;
    if (currentTokenCombatTurn && allowVsRemoveCondition && effectApplied) {
      console.warn(`Removing ${targetTokenTracker.condition}`);
      await attemptRemoval(target, targetTokenTracker.condition, item);
    }
  } else if (args[0] == "off") {
    const safeName = lastArg.efData.label.replace(/\s|'|\.|’/g, "_");
    const targetToken = await fromUuid(lastArg.tokenUuid);
    const targetTokenTracker = await DAE.getFlag(targetToken, `${safeName}Tracker`);
    const removeOnOff = true;
  
    if (targetTokenTracker?.condition && removeOnOff && game.dfreds.effectInterface.hasEffectApplied(targetTokenTracker.condition, lastArg.tokenUuid)) {
      console.debug(`Removing ${targetTokenTracker.condition} from ${targetToken.name}`);
      game.dfreds.effectInterface.removeEffect({ effectName: "Restrained", uuid: lastArg.tokenUuid });
    }
  
    if (targetTokenTracker) {
      targetTokenTracker.hasLeft = true;
      targetTokenTracker.turn = game.combat.turn;
      targetTokenTracker.round = game.combat.round;
      await DAE.setFlag(targetToken, `${safeName}Tracker`, targetTokenTracker);
    }
  }