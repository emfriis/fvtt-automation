//stunning strike
try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postDamageRoll" || args[0].item.system.actionType !== "mwak" || !args[0].hitTargets.length) return;
    const usesItem = args[0].actor.items.find(i => i.name === "Ki" && i.system.uses.value);
    const target = workflow.hitTargets.values().next().value.actor;
    if (!usesItem || !target) return;
    let dialog = new Promise((resolve) => {
        new Dialog({
        title: "Stunning Strike: Usage Configuration",
        content: `
        <form id="use-form">
            <p>Expend a Ki Point to use Stunning Strike?</p>
            <p>(` + usesItem.system.uses.value + ` Ki Remaining)</p>
        </form>
        `,
        buttons: {
            confirm: {
                icon: '<i class="fas fa-check"></i>',
                label: "Confirm",
                callback: () => resolve(true)
            },
            cancel: {
                icon: '<i class="fas fa-times"></i>',
                label: "Cancel",
                callback: () => {resolve(false)}
            }
        },
        default: "cancel",
        close: () => {resolve(false)}
        }).render(true);
    });
    useFeat = await dialog;
    const itemData = {
        name: "Ki: Stunning Strike",
        img: "icons/skills/melee/unarmed-punch-fist-blue.webp",
        type: "feat",
        system: {
            activation: { type: "special" },
            target: { type: "self" },
            range: { units: "self" },
            actionType: "save",
            save: { ability: "con", dc: `${8 + args[0].actor.system.attributes.prof + args[0].actor.system.abilities.wis.mod}`, scaling: "flat" },
        },
        effects: [{ 
            changes: [{ key: "macro.CE", mode: 0, value: "Stunned", priority: 20 }], 
            disabled: false,
            transfer: false,
            isSuppressed: false, 
            icon: "icons/skills/melee/unarmed-punch-fist-blue.webp", 
            name: "Stunning Strike", 
            duration: { rounds: 1, turns: 1 },
            flags: { dae: { specialDuration: ["turnEndSource"] } }
        }],
        flags: { autoanimations: { isEnabled: false } }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: target });
    await MidiQOL.completeItemRoll(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
    await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
} catch (err) {console.error("Stunning Strike Macro - ", err)}