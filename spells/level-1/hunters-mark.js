// hunter's mark
// needs hook for args[0] === "each" to reapply mark

if (args[0].hitTargets.length === 0) return;
if (args[0].tag === "OnUse") {
  const targetUuid = args[0].hitTargets[0].uuid;
  const tokenOrActor = await fromUuid(args[0].actorUuid);
  const caster = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
  const durationSeconds = args[0].item.level > 4 ? 86400 : args[0].item.level > 2 ? 28800 : 3600; 

  if (!caster || !targetUuid) {
    ui.notifications.warn("Hunter's Mark: no token/target selected");
    console.error("Hunter's Mark: no token/target selected");
    return;
  }

  const effectData = {
    changes: [
      {
        key: "flags.midi-qol.huntersMark",
        mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
        value: targetUuid,
        priority: 20,
      }, // who is marked
      {
        key: "flags.dnd5e.DamageBonusMacro",
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: `ItemMacro.${args[0].item.name}`,
        priority: 20,
      }, // macro to apply the damage
    ],
    origin: args[0].itemUuid,
    disabled: false,
    duration: { seconds: durationSeconds },
    icon: args[0].item.img,
    label: args[0].item.name,
  };
  effectData.duration.startTime = game.time.worldTime;
  await caster.createEmbeddedDocuments("ActiveEffect", [effectData]);
} else if (args[0].tag === "DamageBonus") {
  // only weapon attacks
  if (!["mwak", "rwak"].includes(args[0].item.data.actionType)) return {};
  const targetUuid = args[0].hitTargets[0].uuid;
  // only on the marked target
  if (targetUuid !== getProperty(args[0].actor.flags, "midi-qol.huntersMark")) return {};
  const damageType = args[0].item.data.damage.parts[0][1];
  const diceMult = args[0].isCritical ? 2 : 1;
  return { damageRoll: `${diceMult}d6[${damageType}]`, flavor: "Hunters Mark Damage" };
}