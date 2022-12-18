// choose damage type
// on use post targeting
// requires base damage type "None"

if (args[0].tag === "OnUse") {
    const options = ["lightning", "thunder"];
    const optionContent = options.map((o) => { return `<option value="${o}">${CONFIG.DND5E.damageTypes[o]}</option>` })
    const content = `
    <div class="form-group">
    <label>Damage Types : </label>
    <select name="types"}>
    ${optionContent}
    </select>
    </div>
    `;
    let dialog = new Promise((resolve, reject) => {
        new Dialog({
            title: "Choose a Damage Type",
            content,
            buttons: {
                Ok: {
                    label: "Ok",
                    callback: (html) => {resolve(html.find("[name=types]")[0].value)},
                },
                Cancel: {
                    label: "Cancel",
                    callback: () => {resolve(false)},
                },
            },
            default: "Cancel",
            close: () => {resolve(false)}
        }).render(true);
    });
    type = await dialog;
    if (!type) return;
    const workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    workflow.defaultDamageType = type;
}