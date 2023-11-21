try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "preItemRoll" && event.shiftKey && args[0].item.system.attunement == 1) {
        usesItem = args[0].actor.items.find(i => i.uuid == args[0].item.uuid && i.system.uses.value);
        if (!usesItem) {
            ui.notifications.warn("No uses of Glimmering Moonbow remaining");
            return false;
        }
        const effectData = {
			changes: [{ key: "system.traits.dr.value", mode: 0, value: "bludgeoning", priority: 20 }, { key: "system.traits.dr.value", mode: 0, value: "piercing", priority: 20 }, { key: "system.traits.dr.value", mode: 0, value: "slashing", priority: 20 }],
			disabled: false,
			origin: args[0].item.uuid,
			name: "Glimmering Moonbow",
			icon: "icons/weapons/bows/bow-ornamental-silver-black.webp",
			duration: { rounds: 1, turns: 1, seconds: 7 },
			flags: { dae: { specialDuration: ["turnStart", "combatEnd"], stackable: "noneName" } }
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        if (game.combat) await game.dfreds.effectInterface.addEffect({ effectName: "Bonus Action", uuid: args[0].actor.uuid });
        await usesItem.update({ "system.uses.value": Math.max(0, usesItem.system.uses.value - 1) });
        return false;
    } else if (args[0].tag == "OnUse" && args[0].macroPass == "preItemRoll" && !event.shiftKey) {
        Hooks.once("dnd5e.preUseItem", (item, config, options) => {
            options.configureDialog = false;
            return true;
        });
        Hooks.once("dnd5e.preItemUsageConsumption", (item, config, options) => {
            config.consumeUsage = false;
            return true;
        });
    }
} catch (err) {console.error("Glimmering Moonbow Macro - ", err)}