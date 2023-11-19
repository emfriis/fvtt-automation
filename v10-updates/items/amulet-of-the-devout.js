try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "preItemRoll" || args[0].item.system?.type?.subtype != "channelDivinity") return;
    const usesItem = args[0].actor.items.find(i => i.name.includes("Amulet of the Devout") && i.system.uses.value && args[0].actor.effects.find(e => e.origin == i.uuid && !e.disabled && !e.isSuppressed));
    if (!usesItem) return;
    let dialog = new Promise((resolve) => {
        new Dialog({
        title: "Usage Configuration: Amulet of the Devout",
        content: `<p>Use Amulet of the Devout to use this feature without expending Channel Divinity?</p>`,
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
    let useItem = await dialog;
    if (!useItem) return;
	Hooks.once("dnd5e.preUseItem", (item, config, options) => {
        options.configureDialog = false;
        config.consumeResource = false;
		return true;
	});
    await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
} catch (err) {console.error("Amulet of the Devout Macro - ", err)}