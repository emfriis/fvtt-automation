try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postDamageRoll" || (!args[0].hitTargets.length && MidiQOL.configSettings().autoRollDamage == "always") || !args[0].damageRoll || args[0].item.type != "spell" || ["", "midi-none", "temphp"].find(d => args[0].item.system.damage.parts[0][1] == d) || !(args[0].item.flags?.["tidy5e-sheet"]?.parentClass?.toLowerCase()?.includes("wizard") || args[0].item.system?.chatFlavor?.toLowerCase()?.includes("wizard") || (!args[0].item.flags?.["tidy5e-sheet"]?.parentClass && !args[0].item.system?.chatFlavor && ["prepared", "always"].includes(args[0].item.system?.preparation?.mode)))) return;
    const usesItem = actor.items.find(i => i.name == "Power Surge" && i.system.uses.value);
    const level = actor.classes.wizard.system.levels;
    if (!usesItem || !level) return;
    let dialog = new Promise((resolve) => {
        new Dialog({
        title: "Usage Configuration: Power Surge",
        content: `<div><p>Use Power Surge to add ${Math.floor(level / 2)} force damage?</p><p>(${usesItem.system.uses.value} Charges Remaining)</p></div>`,
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
    let useFeat = await dialog;
    if (!useFeat) return;
    let bonusRoll = await new Roll('0 + ' + `${Math.floor(level / 2)}[force]`).evaluate({async: true});
    if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
    for (let i = 1; i < bonusRoll.terms.length; i++) {
        args[0].damageRoll.terms.push(bonusRoll.terms[i]);
    }
    args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${Math.floor(level / 2)}[force]`;
    args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
    await args[0].workflow.setDamageRoll(args[0].damageRoll);
    await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
} catch (err)  {console.error("Power Surge Macro - ", err)}