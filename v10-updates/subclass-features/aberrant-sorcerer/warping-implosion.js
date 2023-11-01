try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "preItemRoll" && !args[0].item.system.uses?.value) {
		const usesItem = args[0].actor.items.find(i => i.name == "Font of Magic" && i.system.uses?.value > 4);
		if (!usesItem) return;
		let dialog = new Promise((resolve) => {
            new Dialog({
            title: "Warping Implosion",
            content: `<p>Spend 5 Sorcery points to use Warping Implosion again?</p>`,
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
		if (!useFeat) return;
        Hooks.once("dnd5e.preUseItem", (item, config, options) => {
            options.configureDialog = false;
            return true;
        });
        Hooks.once("dnd5e.preItemUsageConsumption", (item, config, options) => {
            config.consumeUsage = false;
            return true;
        });
		await usesItem.update({"system.uses.value": Math.max(0, usesItem.system.uses.value - 5)});
    }
} catch (err)  {console.error("Warping Implosion Macro - ", err)}