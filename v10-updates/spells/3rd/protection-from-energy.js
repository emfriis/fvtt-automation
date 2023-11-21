try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postActiveEffects" || !args[0].targets.length || !args[0].targets[0]?.actor) return;
    const options = ["Acid", "Cold", "Fire", "Lightning", "Thunder"];
    const optionContent = options.map((o) => { return `<option value="${o}">${o}</option>` });
    let dialog = new Promise((resolve,) => {
        new Dialog({
            title: "Protection from Energy: Choose a Damage Type",
            content: `<div class="form-group"><label>Damage Types: </label><select name="types"}>${optionContent}</select></div>`,
            buttons: {
                Confirm: {
                    label: "Confirm",
                    callback: () => {resolve($("[name=types]")[0].value)},
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
    let effectData = {
        name: "Protection from Energy",
        icon: "icons/magic/defensive/shield-barrier-flaming-diamond-teal.webp",
        changes: [{ key: `data.traits.dr.value`, mode: 2, value: type.toLowerCase(), priority: 20 }],
        disabled: false,
        origin: args[0].item.uuid,
        duration: { seconds: 3600 },
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
} catch (err) {console.error("Protection from Energy Macro - ", err)}