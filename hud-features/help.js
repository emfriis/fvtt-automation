// help

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (!tactor || !lastArg.targetUuids || lastArg.targetUuids.length === 0) return;

const tokenOrActorTarget = await fromUuid(lastArg.targetUuids[0]);
const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;

if (args[0].macroPass === "preambleComplete") {
    if (!tactorTarget || token.data.disposition === -lastArg.targets[0].data.disposition || lastArg.tokenUuid === lastArg.targetUuids[0]) return;

    let dialog = new Promise(async (resolve, reject) => {
        new Dialog({
            title: `Help Action`,
            content: `Help with check or attack?`,
            buttons: {
                Check: {
                    label: "Check",
                    callback: () => {resolve("check")}
                },
                Attack: {
                    label: "Attack",
                    callback: () => {resolve("attack")}
                }
            },
            default: "Attack"
        }).render(true);
    });
    let helpType = await dialog;

    if (!helpType) return;
    if (helpType === "check") {
        const effectData = {
            changes: [
                { key: `flags.midi-qol.advantage.ability.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 },
                { key: `flags.midi-qol.advantage.skill.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 },
            ],
            origin: args[0].uuid,
            flags: {
                "dae": { specialDuration: ["isCheck","isSkill"] },
                "core": { statusId: "Help" },
            },
            disabled: false,
            label: "Help",
            icon: "icons/svg/upgrade.svg"
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
    } else if (helpType === "attack") {
        let helpDialog =  new Promise(async (resolve, reject) => {
            new Dialog({
                title: "Helpn",
                content: `<p>Target a creature to help against.</p>`,
                buttons: {
                    Ok: {
                        label: "Ok",
                        callback: () => { resolve(Array.from(game.user?.targets[0])) },
                    },
                },
                default: "Ok",
                close: () => { resolve(false) },
            }).render(true);
        });
        let helpTarget = await helpDialog;
        if (!helpTarget) return;

        const effectData = {
            changes: [
                { key: `flags.midi-qol.onUseMacroName`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Help, preAttackRoll", priority: 20 },
                { key: `flags.midi-qol.help`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `+${helpTarget.id}`, priority: 20 },
            ],
            origin: args[0].uuid,
            flags: { "core": { statusId: "Help" }, },
            disabled: false,
            label: "Help",
            icon: "icons/svg/upgrade.svg"
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
    };
} else if (args[0].macroPass === "preAttackRoll") {
    if (!["mwak","rwak","msak","rsak"].includes(args[0].item.data.actionType)) return;
    if (!args[0].targets.find(t => tactor.data.flags["midi-qol"]?.help?.includes(t.id))) return;
    const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    attackWorkflow.advantage = true;
    const effect = tactor.effects.find(e => e.data.label === "Help" && e.data.changes.find(c => args[0].targets.find(t => c.includes(t.id))));
    if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
};
