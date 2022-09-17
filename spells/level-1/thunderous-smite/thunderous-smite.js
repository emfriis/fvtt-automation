try {
    if (args[0].tag !== "DamageBonus" || !["mwak"].includes(args[0].item.data.actionType)) return {};
    if (args[0].hitTargetUuids.length === 0) return {}; // did not hit anyone
    for (let tokenUuid of args[0].hitTargetUuids) {
      const target = await fromUuid(tokenUuid);
      const tactor = target.actor ? target.actor : target;
      const spellDC = args[0].actor.data.data.spelldc;
  
      const saveRollData =  {
        request: "save",
        targetUuid: tactor.uuid,
        ability: "str",
        options: {
          chatMessage: true,
          fastForward: true,
          flavor: `${CONFIG.DND5E.abilities["str"]} vs Thunderous Smite Stagger`,
        },
      };
  
      const saveRoll = await MidiQOL.socket().executeAsGM("rollAbility", saveRollData);
  
      if (saveRoll.total < spellDC) {
        if (!tactor.effects.find(i => i.data.label === "Prone")) {
            game.dfreds.effectInterface.addEffect({ effectName: "Prone", uuid: tactor.uuid });
        }
        ChatMessage.create({ content: `${tactor.name} has failed the save and is pushed back 10ft and knocked prone.` });
      }
    }
    Hooks.once("midi-qol.RollComplete", (workflow) => {
      console.log("Deleting concentration");
      const effect = MidiQOL.getConcentrationEffect(actor);
      if (effect) effect.delete();
      return true;
    });
    const diceMult = args[0].isCritical ? 2 : 1;
    return { damageRoll: `${diceMult * 2}d6[thunder]`, flavor: "Thunderous Smite" };
  } catch (err) {
    console.error(`${args[0].itemData.name} - Thunderous Smite`, err);
  }