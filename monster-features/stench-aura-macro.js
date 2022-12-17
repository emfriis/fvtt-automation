// stench

const lastArg = args[args.length - 1];
const item = await fromUuid(lastArg.efData.origin);
const caster = item.parent;
const target = await fromUuid(lastArg.actorUuid);
const tactor = target.actor ? target.actor : target;
if (getProperty(tactor.data.flags, "midi-qol.stenchImmunity")?.includes(caster.name) || tactor.data.data.traits.ci.value.includes("poisoned")) return;

if (args[0] === "each") {
    const targetUuid = lastArg.actorUuid;
    const dc = 10;
    const getResist = tactor.data.flags["midi-qol"]?.resilience?.poisoned;
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
            label: `${caster.name} Stench Immunity`,
            origin: args[0].uuid,
            disabled: false,
            flags: { dae: { specialDuration: ["longRest"] } },
            changes: [
                { key: `flags.midi-qol.stenchImmunity`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: caster.name, priority: 20 },
            ]
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetUuid, effects: [effectData] });
    }
}