// mass cure wounds
// on use post targeting
// for auto animation do not delete on play animation - leave for this macro to do

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const itemUuid = lastArg.uuid;

if (args[0].tag === "OnUse" && lastArg.macroPass === "preambleComplete") {
    const maxTargets = 6;
    const shape = "sphere";
    let targetsDialog =  new Promise(async (resolve, reject) => {
        new Dialog({
            title: `${lastArg.item.name}`,
            content: `<p>Target up to ${maxTargets} creatures within the ${shape}.</p>`,
            buttons: {
                Ok: {
                    label: "Ok",
                    callback: () => { resolve(Array.from(game.user?.targets)) },
                },
            },
            default: "Ok",
            close: () => { resolve(false) },
        }).render(true);
    });
    let targets = await targetsDialog;

    if (!targets) {
        if (lastArg.templateId) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [lastArg.templateId]);
        return ui.notifications.warn(`No Targets Selected`);
    }
    if (targets.length > maxTargets) {
        if (lastArg.templateId) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [lastArg.templateId]);
        return ui.notifications.warn(`Too many targets selected (${maxTargets} Maximum)`);
    }

    let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    let finalTargets = [];
    for (let t = 0; t < targets.length; t++) {
        if (lastArg.targetUuids.includes(targets[t].document.uuid)) {
            finalTargets.push(targets[t]);
        } else {
            game.user?.targets?.delete(targets[t]);
            targets[t].targeted?.delete(game.user);
        }
    }
    workflow.targets = new Set(finalTargets);
    workflow.hitTargets = new Set(finalTargets);
    if (lastArg.templateId) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [lastArg.templateId]);
}