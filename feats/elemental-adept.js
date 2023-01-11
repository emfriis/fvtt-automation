// elemental adept
// effect on use post damage

const tokenOrActor = await fromUuid(args[0].actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;

if (args[0].tag === "OnUse" && args[0].macroPass === "postDamageRoll" && tactor.data.flags["midi-qol"].elementalAdept) {
  if (args[0].item.type !== "spell" && !args[0].item.flags?.midiProperties?.spelleffect) return;
  if (!args[0].item.data.damage.parts.find(p => tactor.data.flags["midi-qol"].elementalAdept.includes(p[1].toLowerCase()))) return;
  let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid); 
  let damageFormula = workflow.damageRoll.formula;
  let newDamageFormula = damageFormula.replace(/d\d{1,2}/g, (i) => (i + "min2"));
  workflow.damageRoll = await new Roll(newDamageFormula).roll();
  workflow.damageTotal = workflow.damageRoll.total;
  workflow.damageRollHTML = await workflow.damageRoll.render();

  for (let t = 0; t < args[0].hitTargets?.length ?? 0; t++) {
    let target = args[0].hitTargets[t];
    let tactorTarget = target.actor;
    if (!tactorTarget) continue;
    let types = [];
    for (let r = 0; r < tactorTarget.data.data.traits.dr.value.length; r++) {
        let res = tactorTarget.data.data.traits.dr.value[r];
        if (tactor.data.flags["midi-qol"].elementalAdept.includes(res.toLowerCase()) && !tactorTarget.data.data.traits.di.value.includes(res)) {
            types.push({ key: "data.traits.dr.value", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `-${res.toLowerCase()}`, priority: 20, });
        }
    }
    if (!types) continue;
    const effectData = {
        changes: types,
        label: "Elemental Adept Weakness",
        flags: { dae: { specialDuration: ["isHit","isDamaged"], stackable: "noneName" } }
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
    let hook = Hooks.on("midi-qol.preApplyDynamicEffects", async (workflowNext) => {
        if (workflowNext.uuid === args[0].uuid) {
            const effects = tactorTarget.effects.filter(i => i.data.label === "Elemental Adept Weakness").map(i => i.id);
            if (effects) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactorTarget.uuid, effects: effects });
            Hooks.off("midi-qol.damageRollComplete", hook);
        }
    });
  }
}