// cause fear

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const sourceToken = canvas.tokens.get(args[1]);

async function attemptRemoval(targetToken, condition, item, getResist) {
    const caster = item.parent;
    const saveDc = caster.data.data.attributes.spelldc;
    const removalCheck = false;
    const ability = "wis";
    const type = removalCheck ? "abil" : "save"; // can be "abil", "save", or "skill"
    const targetUuid = targetToken.actor.uuid;
    const rollOptions = getResist ? { chatMessage: true, fastForward: true, advantage: true } : { chatMessage: true, fastForward: true };
    const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: type, targetUuid: targetUuid, ability: ability, options: rollOptions });
    if (game.dice3d) game.dice3d.showForRoll(roll);

    if (roll.total >= saveDc) {
        let fear = tactor.effects.find(i => i.data === lastArg.efData);
		if (fear) await tactor.deleteEmbeddedDocuments("ActiveEffect", [fear.id]);
    } else {
        if (roll.total < saveDc) ChatMessage.create({ content: `${targetToken.name} fails the roll for ${item.name}, still has the ${condition} condition.` });
    }
}

if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0 && args[0].macroPass === "preSave") {
    const resist = ["Brave", "Fear Resilience"];
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
            await tactorTarget.createEmbeddedDocuments("ActiveEffect", [effectData]);
        }
    }
}

if (args[0] === "each" && lastArg.efData.disabled === false) {
    const resist = ["Brave", "Fear Resilience", "Magic Resistance"];
    const getResist = tactor.items.find(i => resist.includes(i.name)) || tactor.effects.find(i => resist.includes(i.data.label));
    const targetToken = await fromUuid(lastArg.tokenUuid);
    const condition = "Frightened";
    const item = await fromUuid(lastArg.efData.origin);
    attemptRemoval(targetToken, condition, item, getResist);
}