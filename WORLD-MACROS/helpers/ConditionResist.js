const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

// ItemMacro beforeSave 

// beforeSave on save type save
if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0 && args[0].macroPass === "preSave") {
    const resist = [];
    for (let i = 0; i < lastArg.targetUuids.length; i++) {
        let tokenOrActorTarget = await fromUuid(lastArg.targetUuids[i]);
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
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
        }
    }
}

// beforeSave on attack type save
if (args[0].tag === "OnUse" && lastArg.hitTargetUuids.length > 0 && args[0].macroPass === "preSave") {
    const resist = [];
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
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
        }
    }
}

// Add magic resistance if spell on end of turn: , "Magic Resistance", "Spell Resistance"

// frightened: ["Brave", "Fear Resilience"]
// CAUSE FEAR, WRATHFUL SMITE, FEAR, MENACING ATTACK

// charmed ["Fey Ancestry", "Duergar Reslience", "Charm Resilience"]
// CHARM PERSON, HYPNOTIC PATTERN

// poisoned ["Dwarven Resilience", "Duergar Resilience", "Stout Resilience", "Poison Resilience"]
// POISON BITE, RAY OF SICKNESS

// paralyzed ["Duergar Resilience", "Paralysis Resilience"]
// HOLD PERSON, HOLD MONSTER

// land's stride ["Land's Stride"]
// ENTANGLE

// prone ["Sure-Footed", "Prone Resilience"]
// POUNCE, RAM, BITE