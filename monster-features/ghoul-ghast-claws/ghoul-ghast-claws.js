// apply paralyzed and allow save end of turn
// effect condition - !("@raceOrType".includes("elf") || "@raceOrType".includes("undead"))

const lastArg = args[args.length - 1];
const saveDc = 10;

async function attemptRemoval(targetToken, condition, item, getResist) {
    const removalCheck = false;
    const ability = "wis";
    const type = removalCheck ? "abil" : "save"; // can be "abil", "save", or "skill"
    const targetUuid = targetToken.actor.uuid;
    const rollOptions = getResist ? { chatMessage: true, fastForward: true, advantage: true } : { chatMessage: true, fastForward: true };
    const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: type, targetUuid: targetUuid, ability: ability, options: rollOptions });
    if (game.dice3d) game.dice3d.showForRoll(roll);

    if (roll.total >= saveDc) {
        let para = tactor.effects.find(i => i.data === lastArg.efData);
		if (para) await tactor.deleteEmbeddedDocuments("ActiveEffect", [para.id]);
    } else {
        if (roll.total < saveDc) ChatMessage.create({ content: `${targetToken.name} fails the roll for, still has the ${condition} condition.` });
    }
}

if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0 && args[0].macroPass === "preSave") {
    const resist = ["Duergar Resilience", "Paralysis Resilience"];
    for (let i = 0; i < lastArg.targetUuids.length; i++) {
        let tokenOrActorTarget = await fromUuid(lastArg.targetUuids[i]);
        let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
        let getResist = tactorTarget.items.find(i => resist.includes(i.name)) || tactorTarget.effects.find(i => resist.includes(i.data.label));
        if (getResist) {
            const effectData1 = {
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
            await tactorTarget.createEmbeddedDocuments("ActiveEffect", [effectData1]);
        }
    }
}

if (args[0] === "each" && lastArg.efData.disabled === false) {
    const resist = ["Duergar Resilience", "Paralysis Resilience"];
    const getResist = tactor.items.find(i => resist.includes(i.name)) || tactor.effects.find(i => resist.includes(i.data.label));
    const targetToken = await fromUuid(lastArg.tokenUuid);
    const condition = "Paralyzed";
    attemptRemoval(targetToken, condition, getResist);
}