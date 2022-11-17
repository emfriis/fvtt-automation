// macro.itemMacro, values : dc abil isCheck

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const resist = [];

async function attemptRemoval(condition, getResist) {
    const dc = args[1];
    const abil = args[2];
    const isCheck = args[3];
    const type = isCheck ? "abil" : "save"; // can be "abil", "save", or "skill"
    const rollOptions = getResist ? { chatMessage: true, fastForward: true, advantage: true } : { chatMessage: true, fastForward: true };
    const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: type, targetUuid: tactor.uuid, ability: abil, options: rollOptions });
    if (game.dice3d) game.dice3d.showForRoll(roll);
    if (roll.total >= dc) {
        let ef = tactor.effects.find(i => i.data === lastArg.efData);
		if (ef) await tactor.deleteEmbeddedDocuments("ActiveEffect", [ef.id]);
    } else {
        if (roll.total < dc) ChatMessage.create({ content: `${tactor.name} fails the roll and still has the ${condition} condition.` });
    }
}

if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0 && args[0].macroPass === "preSave") {
    if (!resist) return;
    for (let i = 0; i < lastArg.hitTargetUuids.length; i++) {
        let tokenOrActorTarget = await fromUuid(lastArg.hitTargetUuids[i]);
        let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
        let getResist = tactorTarget.items.find(i => resist.includes(i.name)) || tactorTarget.effects.find(i => resist.includes(i.data.label));
        if (getResist) {
            const effectData = {
                changes: [
                    {
                        key: "flags.midi-qol.advantage.ability.save.all",
                        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
                        value: 1,
                        priority: 20,
                    }
                ],
                disabled: false,
                flags: { dae: { specialDuration: ["isSave"] } },
                icon: args[0].item.img,
                label: `${args[0].item.name} Save Advantage`,
            };
            await tactorTarget.createEmbeddedDocuments("ActiveEffect", [effectData]);
        }
    }
}

if (args[0] === "each" && lastArg.efData.disabled === false) {
    const getResist = false;
    if (resist) getResist = tactor.items.find(i => resist.includes(i.name)) || tactor.effects.find(i => resist.includes(i.data.label));
    const condition = lastArg.efData.label;
    attemptRemoval(condition, getResist);
}