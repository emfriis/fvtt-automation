// transmuted spell
// effect on use post targeting

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const item = await fromUuid(lastArg.uuid);
const usesItem = tactor.items.find(i => i.name === "Sorcery Points");
if (!usesItem || !usesItem.data.data.uses.value) return;

if (args[0].tag !== "OnUse" || lastArg.macroPass !== "preambleComplete" || lastArg.item.type !== "spell") return;

let options = ["acid", "cold", "fire", "lightning", "poison", "thunder"];
if (!item.data.data.damage?.parts?.length || !item.data.data.damage.parts.find(p => options.includes(p[1].toLowerCase()))) return;

const optionContent = options.map((o) => { return `<option value="${o}">${CONFIG.DND5E.damageTypes[o]}</option>` })
const content = `
<div class="form-group">
<label>Damage Types: </label>
<select name="types"}>
${optionContent}
</select>
</div>
`;
let typeDialog =  new Promise(async (resolve, reject) => {
    new Dialog({
        title: "Metamagic: Transmuted Spell",
        content,
        buttons: {
            Ok: {
                label: "Ok",
                callback: (html) => {resolve(html.find("[name=types]")[0].value)},
            },
        },
        default: "Ok",
        close: () => { resolve(false) },
    }).render(true);
});
let type = await typeDialog;
if (!type) return;

let parts = item.data.data.damage.parts;
const workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
workflow.defaultDamageType = type;
workflow.item.data.data.damage.parts.forEach(part => {
    if (!options.includes(part[1].toLowerCase())) return;
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