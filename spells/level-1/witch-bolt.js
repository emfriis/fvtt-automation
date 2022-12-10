// macro by MrPrimate

const lastArg = args[args.length - 1];
const sourceItem = await fromUuid(lastArg.origin);
const caster = sourceItem.parent;
const damageType = "lightning";
const parentEffectName = "WitchBolt (Concentration)";
const hasParentEffect = caster.effects.some((e) => e.data.label === parentEffectName);

async function checkTargetInRange({ sourceUuid, targetUuid, distance }) {
  const sourceToken = await fromUuid(sourceUuid);
  if (!sourceToken) return false;
  const targetsInRange = MidiQOL.findNearby(null, sourceToken, distance, null);
  const isInRange = targetsInRange.reduce((result, possible) => {
    const collisionRay = new Ray(sourceToken, possible);
    const collision = canvas.walls.checkCollision(collisionRay);
    if (possible.uuid === targetUuid && !collision) result = true;
    return result;
  }, false);
  return isInRange;
}

async function sustainedDamage(options) {
  const damageRoll = await new Roll(`1d12[${damageType}]`).evaluate({ async: true });
  if (game.dice3d) game.dice3d.showForRoll(damageRoll, game.users.get(options.userId));

  const targets = await Promise.all(options.targets.map(async (uuid) => await fromUuid(uuid)));
  const casterToken = await fromUuid(options.sourceUuid);
  const itemData = sourceItem.toObject();
  setProperty(itemData, "data.components.concentration", false);
  new MidiQOL.DamageOnlyWorkflow(
    caster,
    casterToken,
    damageRoll.total,
    damageType,
    targets,
    damageRoll,
    {
      flavor: `(${CONFIG.DND5E.damageTypes[damageType]})`,
      itemCardId: "new",
      itemData: itemData,
      isCritical: false,
    }
  );

}

async function cancel() {
  const concentration = caster.effects.find((i) => i.data.label === "Concentrating");
  if (concentration) {
    await MidiQOL.socket().removeEffects({ actorUuid: caster.uuid, effects: [concentration.id] });
  }
  await DAE.unsetFlag(caster, "witchBoltSpell");
}

if (args[0] === "on" && !hasParentEffect && caster.uuid !== lastArg.actorUuid) {
  // create caster round-by-round damage effect
  const sourceItem = await fromUuid(lastArg.origin);
  const effectData = [{
    label: parentEffectName,
    icon: sourceItem.img,
    duration: { rounds: 10, startTime: game.time.worldTime },
    origin: lastArg.origin,
    changes: [{
      key: "macro.itemMacro.local",
      value: "",
      mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
      priority: 20,
    }],
    disabled: false,
    "flags.dae.macroRepeat": "startEveryTurn",
  }];

  const targets = [];
  for (let t of game.user.targets) {
    targets.push(t.document.uuid);
  }
  const casterToken = canvas.tokens.placeables.find((t) => t.actor?.id === caster.id);
  const options = {
    targets,
    sourceUuid: casterToken?.document?.uuid,
    distance: sourceItem.data.data.range.value,
    userId: game.userId,
  };
  DAE.setFlag(caster, "witchBoltSpell", options);
  await caster.createEmbeddedDocuments("ActiveEffect", effectData);
} else if (args[0] == "off") {
  DAE.unsetFlag(caster, "witchBoltSpell");
} else if (args[0] == "each") {
  const options = DAE.getFlag(caster, "witchBoltSpell");
  const isOn = await checkTargetInRange(options);
  if (isOn) {
    new Dialog({
      title: sourceItem.name,
      content: "<p>Use action to sustain Witch Bolt?</p>",
      buttons: {
        continue: {
          label: "Sustain",
          callback: () => sustainedDamage(options)
        },
        end: {
          label: "End concentration",
          callback: () => cancel()
        }
      }
    }).render(true);
  } else {
    //remove ef/conc if not in range
  }
}