// divine smite
// requires MIDI-QOL

try {

    if (!["mwak"].includes(args[0].itemData.data.actionType)) return {}; // melee weapon attack
    if (args[0].hitTargets.length < 1) return {};
    token = canvas.tokens.get(args[0].tokenId);
    actor = token.actor;
    if (!actor || !token || args[0].hitTargets.length < 1) return {};
    let target = canvas.tokens.get(args[0].hitTargets[0].id ?? args[0].hitTargets[0]._id);
    if (!target) console.error("No target for Divine Smite found");
    
    // Get options for available slots
     let optionsText = "";
    let i = 1;
    for (; i < 9; i++) {
      const slots = getSpellSlots(actor, i, false);
        if (slots.value > 0) {
          const level = CONFIG.DND5E.spellLevels[i];
          const label = game.i18n.format('DND5E.SpellLevelSlot', {level: level, n: slots.value});
          optionsText += `<option value="${i}">${label}</option>`;
        }
    }
      
    // Check for Pact slot
    const slots = getSpellSlots(actor, 0, true);
    if(slots.value > 0) {
    i++;
      const level = CONFIG.DND5E.spellLevels[slots.level];
      const label = game.i18n.format('DND5E.SpellLevelSlot', {level: level, n: slots.value}) + ' (Pact)';
      optionsText += `<option value="${i}">${label}</option>`;
    }
      
    if (optionsText != "") {
  
      let dialog = new Promise((resolve, reject) => {
          // Create a dialogue box to select spell slot level to use when smiting.
          new Dialog({
              title: "Divine Smite: Usage Configuration",
              content: `
              <form id="smite-use-form">
                  <p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Divine Smite", type: "feature"}) + `</p>
                  <div class="form-group">
                      <label>Spell Slot Level</label>
                      <div class="form-fields">
                          <select id="slot" name="slot-level">` + optionsText + `</select>
                      </div>
                  </div>
                  <div class="form-group">
                      <label class="checkbox">
                      <input id="consume" type="checkbox" name="consumeCheckbox" checked/>` + game.i18n.localize("DND5E.SpellCastConsume") + `</label>
                  </div>
              </form>
              `,
              buttons: {
                  one: {
                      icon: '<i class="fas fa-check"></i>',
                      label: "Smite",
                      callback: () => resolve([parseInt(Array.from((document.getElementById("slot")).options[(document.getElementById("slot")).selectedIndex].text)[0]), $('#consume').is(":checked"), ((document.getElementById("slot")).options[(document.getElementById("slot")).selectedIndex].text)])
                  },
                  two: {
                      icon: '<i class="fas fa-times"></i>',
                      label: "Cancel",
                      callback: () => {resolve(false)}
                  }
              },
              default: "two",
              close: () => {resolve(false)}
          }).render(true);
      });
      smite = await dialog;
      
      if (!smite) return {}
      
      let slotLevel = smite[0];
      let consumeSlot = smite[1];
      let pactSlot = (smite[2].slice(smite[2].length - 6) == "(Pact)") ? true : false;
      
      let chosenSpellSlots = getSpellSlots(actor, slotLevel, pactSlot);
      if (chosenSpellSlots.value < 1 && consumeSlot) {
          ui.notifications.warn("Divine Smite: No Slots of Selected Level Remaining");
          return {};
      }
      
      if (consumeSlot) {
          
          let objUpdate = new Object();
          if (!pactSlot) {
              objUpdate['data.spells.spell' + slotLevel + '.value'] = chosenSpellSlots.value - 1;
          } else {
              objUpdate['data.spells.pact.value'] = chosenSpellSlots.value - 1;
          }
          actor.update(objUpdate);
      }
      
      let diceMult = args[0].isCritical ? 2: 1;
      let numDice = 1 + slotLevel;
      if (numDice > 5) numDice = 5;
      let smiteType = ["fiend", "fiend (shapechanger)", "undead", "undead (shapechanger)"].some(type => (target?.actor.data.data.details?.type?.value || "").toLowerCase().includes(type));
      if (smiteType) numDice += 1;
      
      return {damageRoll: `${numDice * diceMult}d8[radiant]`, flavor: "Divine Smite"};
    }
  } catch (err) {
      console.error(`${args[0].itemData.name} - Divine Smite macro`, err);
  }
  
  function getSpellSlots(actor, level, isPact) {
    if(isPact == false) {
      return actor.data.data.spells[`spell${level}`];
    }
    else {
      return actor.data.data.spells.pact;
    }
  }