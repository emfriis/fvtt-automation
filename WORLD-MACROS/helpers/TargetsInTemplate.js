// targets in template helper
// for auto animation do not delete on play animation - leave for this macro to do

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

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
    let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    if (!targets) {
        workflow.targets = new Set();
        return ui.notifications.warn(`No Targets Selected`);
    }
    if (targets.length > maxTargets) return ui.notifications.warn(`Too many targets selected (${maxTargets} Maximum)`);
    for (let t = 0; t < targets.length; t++) {
        if (!lastArg.targetUuids.includes(targets[t].document.uuid)) {
            workflow.targets = new Set();
            return ui.notifications.warn(`Not all targets within the ${shape}`);
        }
    }
    workflow.targets = new Set(targets);
    if (workflow?.templateId) await canvas.scene.deleteEmbeddedDocuments("MeasuredTemplate", [workflow.templateId]);
}