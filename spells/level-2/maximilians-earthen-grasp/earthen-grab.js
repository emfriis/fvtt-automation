// maximilian's earthen grasp - earthen grab

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function attemptRemoval(targetToken, condition, item) {
    if (game.dfreds.effectInterface.hasEffectApplied(condition, targetToken.uuid)) {
        new Dialog({
            title: `Use action to attempt to remove ${condition}?`,
            buttons: {
                one: {
                    label: "Yes",
                    callback: async () => {
                        const caster = item.parent;
                        const saveDc = caster.data.data.attributes.spelldc;
                        const removalCheck = true;
                        const ability = "str";
                        const type = removalCheck ? "abil" : "save"; // can be "abil", "save", or "skill"
                        const targetUuid = targetToken.actor.uuid;
                        const rollOptions = { chatMessage: true, fastForward: true };
                        const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: type, targetUuid: targetUuid, ability: ability, options: rollOptions });
                        if (game.dice3d) game.dice3d.showForRoll(roll);

                        if (roll.total >= saveDc) {
                            let ef = tactor.effects.find(i => i.data === lastArg.efData);
                            if (ef) await tactor.deleteEmbeddedDocuments("ActiveEffect", [ef.id]);
                        } else {
                            if (roll.total < saveDc) ChatMessage.create({ content: `${targetToken.name} fails the roll for ${item.name}, still has the ${condition} condition.` });
                        }
                    },
                },
                two: {
                    label: "No",
                    callback: () => {},
                },
            },
        }).render(true);
    }
}

if (args[0].tag === "OnUse") {
    const tokenTarget = lastArg.targets[0];
    const actorTarget = tokenTarget?.actor;
    const grasp = tactor.effects.find(e => e.data.label === "Grasp");
    if (grasp) await tactor.deleteEmbeddedDocuments("ActiveEffect", [grasp.id]);
    const restrained = actorTarget.effects.find(e => e.data.label === "Restrained" && e.data.origin === lastArg.uuid);
    let effectData = [{
        changes: [
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: restrained.uuid, priority: 20 }
        ],
        disabled: false,
        icon: lastArg.item.img,
        label: "Grasp"
    }];
    if (restrained) await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: effectData });
}

if (args[0] === "each" && lastArg.efData.disabled === false) {
    const targetToken = await fromUuid(lastArg.tokenUuid);
    const condition = "Restrained";
    const item = await fromUuid(lastArg.efData.origin);
    attemptRemoval(targetToken, condition, item);
}