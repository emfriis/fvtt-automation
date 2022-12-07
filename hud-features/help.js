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
        const targets = await canvas.tokens.placeables.filter((t) =>
            (t.document.uuid !== token.document.uuid) &&
            (t.document.uuid !== lastArg.targetUuids[0]) &&
            t?.actor?.data.data.attributes.hp.value !== 0 &&
            MidiQOL.getDistance(token, t, false) <= 5
        );
        console.warn(targets);
        let dialog = new Promise((resolve, reject) => {
            let optionsContent = "";
            (targets).forEach((option) => {
                optionsContent += `<label class="radio-label">
                <input type="radio" name="option" value="${option.document.uuid ?? option.uuid}">
                <img src="${option.img ?? option.data.img}" style="border:0px; width: 100px; height:100px;">
                ${option.name ?? option.data.name}
                </label>`;
            });
            let content = `
                <style>
                .option .form-group {
                    display: flex;
                    flex-wrap: wrap;
                    width: 100%;
                    align-items: flex-start;
                }

                .option .radio-label {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    justify-items: center;
                    flex: 1 0 25%;
                    line-height: normal;
                }

                .option .radio-label input {
                    display: none;
                }

                .option img {
                    border: 0px;
                    width: 50px;
                    height: 50px;
                    flex: 0 0 50px;
                    cursor: pointer;
                }

                /* CHECKED STYLES */
                .option [type=radio]:checked + img {
                    outline: 2px solid #f00;
                }
                </style>
                <form class="option">
                <div class="form-group" id="options">
                    ${optionsContent}
                </div>
                </form>
            `;
            new Dialog({
                title: `Choose a target`,
                content: `${content ?? ""}`,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirm",
                        callback: () => {resolve($("input[type='radio'][name='option']:checked").val())} 
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => {resolve(false)}
                    }
                },
                default: "two",
                close: callBack => {resolve(false)}
            }).render(true);
        });
        let helpTarget = await dialog;

        if (!helpTarget) return;

        const effectData = {
            changes: [
                { key: `flags.midi-qol.onUseMacroName`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Help, preAttackRoll", priority: 20 },
                { key: `flags.midi-qol.help`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: helpTarget, priority: 20 },
            ],
            origin: args[0].uuid,
            flags: {
                "core": { statusId: "Help" },
            },
            disabled: false,
            label: "Help",
            icon: "icons/svg/upgrade.svg"
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
    };
} else if (args[0].macroPass === "preAttackRoll") {
    if (!["mwak","rwak","msak","rsak"].includes(args[0].item.data.actionType)) return;
    if (!tactor.data.flags["midi-qol"]?.help?.includes(tactorTarget.uuid)) return;
    const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    attackWorkflow.advantage = true;
    const ef = tactor.effects.find(i => i.data.label === "Help" && i.data.changes.find(e => e.value.includes(tactorTarget.uuid)));
    if (ef) await tactor.deleteEmbeddedDocuments("ActiveEffect", [ef.id]);
};
