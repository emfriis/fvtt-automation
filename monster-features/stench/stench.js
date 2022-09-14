// stench

const lastArg = args[args.length - 1];
const item = await fromUuid(lastArg.efData.origin);
const caster = item.parent;
const target = await fromUuid(lastArg.actorUuid);
const tactor = target.actor ? target.actor : target;
if (getProperty(tactor.data.flags, "midi-qol.ghoulStenchImmunity") || tactor.data.data.traits.ci.value.includes("poisoned")) return;

if (args[0] === "each") {
    const targetUuid = lastArg.actorUuid;
    const rollOptions = { chatMessage: true, fastForward: true };
    const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: "save", targetUuid: targetUuid, ability: "con", options: rollOptions });
    if (game.dice3d) game.dice3d.showForRoll(roll);

    if (roll.total < 10) {
        let effectData = {
            label: "Poisoned",
            origin: args[0].uuid,
            disabled: false,
            flags: { dae: { specialDuration: ["turnStart"] } },
            duration: {rounds: 1, turns: 1, startTime: game.time.worldTime},
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