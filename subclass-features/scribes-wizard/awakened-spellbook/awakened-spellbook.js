// awakened spellbook
// effect on use post targeting

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && args[0].item.type === "spell" && args[0].spellLevel > 0 && args[0].item.data.damage?.parts?.length > 0 && ["action", "bonus", "reaction", "reactiondamage", "reactionmanual"].includes(args[0].item.data.activation.type)) {
    const validTypes = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"];
    if (!validTypes.some(type => args[0].item.data.damage.parts[0][1]?.toLowerCase() === type)) return;
    const optionTypes = [];
    tactor.data.items.forEach(i => {
        if (i.type === "spell" && i.data.data.level === args[0].spellLevel) {
            validTypes.forEach(t => {
                if (optionTypes.includes(t)) return;
                if (i.data.data.description.value?.toLowerCase().includes(t)) optionTypes.push(t);
            });
        }
    });
    if (optionTypes.length === 0) return;

    const optionContent = optionTypes.map((o) => { return `<option value="${o}">${CONFIG.DND5E.damageTypes[o]}</option>` })
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
            title: "Awakened Spellbook: Replace Damage Type?",
            content,
            buttons: {
                Confirm: {
                    label: "Confirm",
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
    let type = await dialog;
    if (!type) return;

    const workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    workflow.defaultDamageType = type;
    const parts = workflow.item.data.data.damage.parts;
    workflow.item.data.data.damage.parts.forEach(part => {
        part[0] = part[0].replace(/\[(.*)\]/g, `[${type}]`);
        part[1] = type;
    });
    
    let hook1 = Hooks.on("midi-qol.RollComplete", async workflowNext => {
        if (workflowNext.uuid === args[0].uuid) {
            workflow.item.update({ "data.data.damage.parts" : parts });
            Hooks.off("midi-qol.RollComplete", hook1);
            Hooks.off("midi-qol.preItemRoll", hook2);
        }
    });
    let hook2 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
        if (workflowNext.uuid === args[0].uuid) {
            workflow.item.update({ "data.data.damage.parts" : parts });
            Hooks.off("midi-qol.RollComplete", hook1);
            Hooks.off("midi-qol.preItemRoll", hook2);
        }
    });
}