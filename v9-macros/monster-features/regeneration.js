// regeneration
// effect itemacro
// args[1] -> "always" for always, "hp" for only 1+ hp
// uses flags.midi-qol.noregen for damage types preventing regen, format -> "type1,type2,type3"

const lastArg = args[args.length - 1];
const item = await fromUuid(lastArg.efData.origin);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "each") {
    if (args[1] === "hp" && tactor.data.data.attributes.hp.value === 0) return;
    if (tactor.effects.find(e => e.data.label === "No Regen")) return;
    let useRegen = await new Promise((resolve, reject) => {
        new Dialog({
            title: "Regeneration",
            content: "Use Feature?",
            buttons: {
                Confirm: {
                    label: "Confirm",
                    callback: async () => {resolve(true)},
                },
                Cancel: {
                    label: "Cancel",
                    callback: async () => {resolve(false)},
                },
            },
            default: "Cancel",
            close: () => {resolve(false)}
        }).render(true);
    });
    if (!useRegen) return;
    const options = { showFullCard: false, createWorkflow: true, configureDialog: false };
    await MidiQOL.completeItemRoll(item, options);
}