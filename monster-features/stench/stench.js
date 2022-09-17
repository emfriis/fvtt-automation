// stench

const lastArg = args[args.length - 1];
const item = await fromUuid(lastArg.efData.origin);
const caster = item.parent;
const target = await fromUuid(lastArg.actorUuid);
const tactor = target.actor ? target.actor : target;
if (getProperty(tactor.data.flags, "midi-qol.ghoulStenchImmunity") || tactor.data.data.traits.ci.value.includes("poisoned")) return;

if (args[0] === "each") {
    const targetUuid = lastArg.actorUuid;
    const dc = 10;
    const resist = ["Dwarven Resilience", "Duergar Resilience", "Stout Resilience", "Poison Resilience"];
    let getResist = tactorTarget.items.find(i => resist.includes(i.name));
    const rollOptions = getResist ? { chatMessage: true, fastForward: true, advantage: true } : { chatMessage: true, fastForward: true };
    const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: "save", targetUuid: targetUuid, ability: "con", options: rollOptions });
    if (game.dice3d) game.dice3d.showForRoll(roll);

    if (roll.total < dc) {
        let effectData = {
            label: "Poisoned",
            origin: args[0].uuid,
            disabled: false,
            flags: { dae: { specialDuration: ["turnStart"] } },
            changes: [
                { key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Poisoned", priority: 20 },
            ]
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetUuid, effects: [effectData] });
    } else {
            let effectData = {
            label: "Ghoul Stench Immunity",
            origin: args[0].uuid,
            disabled: false,
            flags: { dae: { specialDuration: ["LongRest"] } },
            changes: [
                { key: `flags.midi-qol.ghoulStenchImmunity`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: caster.uuid, priority: 20 },
            ]
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetUuid, effects: [effectData] });
    }
}