// dragon's breath

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse") {
    const content = `
    <div class="form-group">
    <label>Damage Types : </label>
    <select name="types"}>
    <option value="acid">${CONFIG.DND5E.damageTypes["acid"]}</option>
    <option value="cold">${CONFIG.DND5E.damageTypes["cold"]}</option>
    <option value="fire">${CONFIG.DND5E.damageTypes["fire"]}</option>
    <option value="lightning">${CONFIG.DND5E.damageTypes["lightning"]}</option>
    <option value="poison">${CONFIG.DND5E.damageTypes["poison"]}</option>
    </select>
    </div>
    `;
    let dialog = new Promise((resolve, reject) => {
        new Dialog({
            title: "Dragon's Breath: Choose a damage type",
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

    const item = lastArg.item;
    const target = lastArg.targets[0]?.actor;
    const spellLevel = lastArg.spellLevel;
    const spellDC = tactor.data.data.attributes.spelldc;
    let effectData = [{
        label: item.name,
        icon: item.img,
        changes: [
            { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `${type} ${spellLevel} ${spellDC}`, priority: 20 },
        ],
        origin: lastArg.uuid,
        duration: { seconds: item.data.duration.value * 60 },
        disabled: false,
        flags: { dae: { itemData: item } , core: { statusId: "Dragon's Breath" }},
    }];
    await target.createEmbeddedDocuments("ActiveEffect", effectData);
}

if (args[0] === "on") {
    const typeFlavour = args[1].charAt(0).toUpperCase() + args[1].slice(1)
    const itemData = {
        name: `Dragon's ${typeFlavour} Breath`,
        type: "feat",
        data: {
            activation: { type: "action", cost: 1, condition: "", },
            target: { value: 15, units: "feet", type: "cone", },
            range: { value: null, long: null, units: "self", },
            actionType: "save",
            chatFlavor: "",
            critical: null,
            damage: { parts: [[`${args[2] + 1}d6`, args[1]]], versatile: "" },
            save: { ability: "dex", dc: args[3], scaling: "flat" },
        },
        flags: { midiProperties: { halfdam: true, magiceffect: true }, breath: tactor.uuid },
        img: "systems/dnd5e/icons/skills/affliction_14.jpg",
    };
    await tactor.createEmbeddedDocuments("Item", [itemData]);
}

if (args[0] === "off") {
    const breath = tactor.data.items.filter((i) => i.data.flags?.breath === tactor.uuid);
    if (breath.length > 0) await tactor.deleteEmbeddedDocuments("Item", breath.map((s) => s.id));
}