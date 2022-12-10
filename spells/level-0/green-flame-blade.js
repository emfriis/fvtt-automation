// green-flame blade

const lastArg = args[args.length - 1];

// macro vars
const damageType = "fire";
const patreonSecondary = "jb2a.chain_lightning.secondary.green";

const baseAutoAnimation = {
  version: 4,
  killAnim: false,
  options: {
    ammo: false,
    menuType: "weapon",
    variant: "01",
    enableCustom: false,
    repeat: null,
    delay: null,
    scale: null,
    customPath: "",
  },
  override: true,
  autoOverride: {
    enable: false,
    variant: "01",
    color: "darkorangepurple",
    repeat: null,
    delay: null,
    scale: null,
  },
  sourceToken: {
    enable: false,
  },
  targetToken: {
    enable: false,
  },
  animLevel: false,
  animType: "melee",
  animation: "shortsword",
  color: "green",
  preview: false,
  meleeSwitch: {
    switchType: "on",
    returning: false,
  },
};


// sequencer caller for effects on target
function sequencerEffect(target, origin = null) {
  if (game.modules.get("sequencer")?.active) {
    if (Sequencer.Database.entryExists(patreonSecondary)) {
      new Sequence()
        .effect()
        .atLocation(origin)
        .stretchTo(target)
        .file(Sequencer.Database.entryExists(patreonSecondary))
        .repeats(1, 200, 300)
        .randomizeMirrorY()
        .play();
    }
  }
}

async function findTargets(originToken, range, includeOrigin = false, excludeActorIds = []) {
  const aoeTargets = await canvas.tokens.placeables.filter((placeable) =>
    (includeOrigin || placeable.id !== originToken.id) &&
    !excludeActorIds.includes(placeable.actor?.id) &&
    placeable.actor?.data.data.attributes.hp.value !== 0 &&
    MidiQOL.getDistance(originToken, placeable, false) <= 5 &&
    !canvas.walls.checkCollision(new Ray(originToken.center, placeable.center)
  ));
  return aoeTargets;
}

function weaponAttack(caster, sourceItemData, origin, target) {
  const chosenWeapon = DAE.getFlag(caster, "greenFlameBladeChoice");
  const filteredWeapons = caster.items.filter((i) =>
    i.data.type === "weapon" && i.data.data.equipped &&
    i.data.data.activation.type ==="action" && i.data.data.actionType == "mwak"
  );

  let weapon_content = "";

  //Filter for weapons
  filteredWeapons.forEach((weapon) => {
    weapon_content += `<label class="radio-label">
    <input type="radio" name="weapon" value="${weapon.id}">
    <img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">
    ${weapon.data.name}
    </label>`;
  });

  let content = `
    <style>
    .weapon .form-group {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-items: flex-start;
      }

      .weapon .radio-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        justify-items: center;
        flex: 1 0 25%;
        line-height: normal;
      }

      .weapon .radio-label input {
        display: none;
      }

      .weapon img {
        border: 0px;
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        cursor: pointer;
      }

      /* CHECKED STYLES */
      .weapon [type=radio]:checked + img {
        outline: 2px solid #f00;
      }
    </style>
    <form class="weapon">
      <div class="form-group" id="weapons">
          ${weapon_content}
      </div>
    </form>
  `;

  new Dialog({
    title: "Green Flame Blade: Choose a weapon",
    content,
    buttons: {
      Ok: {
        label: "Ok",
        callback: async () => {
          const characterLevel = caster.data.type === "character" ? caster.data.data.details.level : caster.data.data.details.cr;
          const cantripDice = 1 + Math.floor((characterLevel + 1) / 6);
          const itemId = $("input[type='radio'][name='weapon']:checked").val();
          const weaponItem = caster.getEmbeddedDocument("Item", itemId);
          DAE.setFlag(caster, "greenFlameBladeChoice", itemId);
          const weaponCopy = duplicate(weaponItem);
          delete weaponCopy._id;
          if (cantripDice > 0) {
            let effectData = {
              changes: [{ key: "flags.dnd5e.DamageBonusMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.${lastArg.item.name}`, priority: 20, }],
              origin: args[0].itemUuid,
              disabled: false,
              flags: { dae: { specialDuration: ["1Attack"] }}
            };
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: caster.uuid, effects: [effectData] });
          }
          weaponCopy.name = weaponItem.name + " [Green Flame Blade]";
          weaponCopy.effects.push({
            changes: [{ key: "macro.itemMacro", mode: 0, value: "", priority: "20", }],
            disabled: false,
            icon: sourceItemData.img,
            label: sourceItemData.name,
            origin,
            transfer: false,
            flags: { targetUuid: target.uuid, casterId: caster.id, origin, cantripDice, damageType, dae: { transfer: false, specialDuration: ["turnEndSource", "isAttacked", "isDamaged"] }},
          });
          setProperty(weaponCopy, "flags.itemacro", duplicate(sourceItemData.flags.itemacro));
          setProperty(weaponCopy, "flags.midi-qol.effectActivation", false);
		      const attackItem = new CONFIG.Item.documentClass(weaponCopy, { parent: caster });
          const options = { showFullCard: false, createWorkflow: true, configureDialog: true };
          await MidiQOL.completeItemRoll(attackItem, options);
        },
      },
      Cancel: {
        label: "Cancel",
      },
    },
  }).render(true);
}

async function attackNearby(originToken, ignoreIds) {
  const potentialTargets = await findTargets(originToken, 5, false, ignoreIds);
  if (potentialTargets.length === 0) return;
  const sourceItem = await fromUuid(lastArg.efData.flags.origin);
  const caster = sourceItem.parent;
  const casterToken = canvas.tokens.placeables.find((t) => t.actor?.uuid === caster.uuid);

  let target_content = "";
  potentialTargets.forEach((t) => {
    target_content += `<label class="radio-label">
    <input type="radio" name="target" value="${t.id}">
    <img src="${t.data.img}" style="border:0px; width: 100px; height:100px;">
    </label>`;
  });

  let content = `
    <style>
    .target .form-group {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        align-items: flex-start;
      }

      .target .radio-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        justify-items: center;
        flex: 1 0 25%;
        line-height: normal;
      }

      .target .radio-label input {
        display: none;
      }

      .target img {
        border: 0px;
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        cursor: pointer;
      }

      /* CHECKED STYLES */
      .target [type=radio]:checked + img {
        outline: 2px solid #f00;
      }
    </style>
    <form class="target">
      <div class="form-group" id="target">
          ${target_content}
      </div>
    </form>
  `;

  new Dialog({
    title: "Green Flame Blade: Choose a secondary target",
    content,
    buttons: {
      Choose: {
        label: "Choose",
        callback: async (html) => {
          const selectedId = $("input[type='radio'][name='target']:checked").val();
          const targetToken = canvas.tokens.get(selectedId);
          const sourceItem = await fromUuid(lastArg.efData.flags.origin);
          const mod = caster.data.data.abilities[sourceItem.abilityMod].mod;
          const damageRoll = await new Roll(`${lastArg.efData.flags.cantripDice - 1}d8[${damageType}] + ${mod}`).evaluate({ async: true });
          if (game.dice3d) game.dice3d.showForRoll(damageRoll);
          const workflowItemData = duplicate(sourceItem.data);
          workflowItemData.data.target = { value: 1, units: "", type: "creature" };
          workflowItemData.name = "Green Flame Blade: Secondary Damage";

          await new MidiQOL.DamageOnlyWorkflow(
            caster,
            casterToken.data,
            damageRoll.total,
            damageType,
            [targetToken],
            damageRoll,
            {
              flavor: `(${CONFIG.DND5E.damageTypes[damageType]})`,
              itemCardId: "new",
              itemData: workflowItemData,
              isCritical: false,
            }
          );
          sequencerEffect(targetToken, originToken);
        },
      },
      Cancel: {
        label: "Cancel",
      },
    },
  }).render(true);
}

if (args[0].tag === "OnUse"){
  if (lastArg.targets.length > 0) {
    const casterData = await fromUuid(lastArg.actorUuid);
    const caster = casterData.actor ? casterData.actor : casterData;
    weaponAttack(caster, lastArg.itemData, lastArg.uuid, lastArg.targets[0]);
  } else {
    ui.notifications.error("Green Flame Blade: No target selected: please select a target and try again.");
  }
} else if (args[0] === "on") {
  const targetToken = canvas.tokens.get(lastArg.tokenId);
  const casterId = lastArg.efData.flags.casterId;
  console.log(`Checking ${targetToken.name} for nearby tokens for Green-Flame Blade from ${casterId}`);
  await attackNearby(targetToken, [casterId]);
}

if (args[0].tag === "DamageBonus" && ["mwak"].includes(args[0].item.data.actionType)) {
  const casterData = await fromUuid(lastArg.actorUuid);
  const caster = casterData.actor ? casterData.actor : casterData;
  const characterLevel = caster.data.type === "character" ? caster.data.data.details.level : caster.data.data.details.cr;
  const cantripDice = 1 + Math.floor((characterLevel + 1) / 6);
	const diceMult = args[0].isCritical ? 2 : 1;
	return { damageRoll: `${diceMult * (cantripDice - 1)}d8[fire]`, flavor: "Green-Flame Blade" };
}