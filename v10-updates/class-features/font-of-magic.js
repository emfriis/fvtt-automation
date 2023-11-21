try {
    if (args[0].tag === "OnUse" && args[0].macroPass === "preItemRoll") {
        Hooks.once("dnd5e.preUseItem", (item, config, options) => {
            options.configureDialog = false;
            return true;
        });
        Hooks.once("dnd5e.preItemUsageConsumption", (item, config, options) => {
            config.consumeUsage = false;
            return true;
        });
    } else if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
        let spend = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 };
        let usesItem = args[0].actor.items.find(i => i.name === "Font of Magic" && i.system.uses);
        let spells = [];
        Object.keys(args[0].actor.system.spells).forEach(key => {
            if (key === "pact" && args[0].actor.system.spells.pact.max > 0) spells.push({type: key, level: args[0].actor.system.spells.pact.level, value: args[0].actor.system.spells.pact.value, max: args[0].actor.system.spells.pact.max});
            if (key !== "pact") spells.push({type: key, level: +key.slice(-1), value: args[0].actor.system.spells[key].value, max: args[0].actor.system.spells[key].max});
        });
        let buttonList = {};
        let options = ""
        if (spells.find(spell => usesItem.system.uses.value >= spend[spell.level])) buttonList.sorcSlot = {
            icon: '<i class="fas fa-bolt"></i>',
            label: "Spell Slot",
            callback: () => {
                spells.filter(spell => usesItem.system.uses.value >= spend[spell.level]).forEach(spell => options += `<option id="${spell.level}" value="${spell.type}">${spell.type === "pact" ? `Pact Magic [Level ${spell.level}]` : `Level ${spell.level}`} (${spell.value}/${spell.max} Slots)</option>`);
                new Dialog({
                    title: "Font of Magic",
                    content: `
                    <form>
                        <p>Choose a Spell Slot to create:</p>
                        <div class="form-group">
                            <label><b>Spell Slot Level</b></label>
                            <div class="form-fields">
                                <select id="slot" name="slot-level">` + options + `</select>
                            </div>
                        </div>
                    </form>
                    `,
                    buttons: {
                        recover: {
                            icon: '<i class="fas fa-bolt"></i>',
                            label: "Convert",
                            callback: async () => {
                                let slot = { type: $("#slot").find(":selected").val(), level: +$("#slot").find(":selected").attr("id") };
                                if (!slot.type || !slot.level) return ui.notifications.warn("No Spell Slot was selected");
                                if (!args[0].actor.system.spells[slot.type].max) {
                                    const effectData = {
                                        changes: [{ key: `system.spells.${slot.type}.max`, mode: 2, value: 1, priority: 20 }, { key: "macro.execute", mode: 0, value: `FontOfMagic ${slot.type}`, priority: 20 }],
                                        name: `Font of Magic: Bonus ${slot.level}${slot.level == 1 ? "st" : slot.level == 2 ? "nd" : slot.level == 3 ? "rd" : "th"} Level Spell Slot`,
                                        icon: "icons/magic/symbols/ring-circle-smoke-blue.webp",
										origin: args[0].item.uuid,
                                        disabled: false,
                                        flags: { dae: { specialDuration: ["longRest"] } }
                                    }
                                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
                                }
                                let spellUpdate = new Object();
                                spellUpdate[`system.spells.${slot.type}.value`] = args[0].actor.system.spells[slot.type].value + 1;
                                await args[0].actor.update(spellUpdate);
                                await usesItem.update({"system.uses.value": usesItem.system.uses.value - spend[slot.level]});
                                let roll_results = `<div><i>Converted ${spend[slot.level]} Sorcery Points. Level ${slot.level} spell slot created.</i></div>`;
                                const chatMessage = game.messages.get(args[0].itemCardId);
                                let content = duplicate(chatMessage.content);
                                const replaceString = `<div class="midi-qol-saves-display"><div class="end-midi-qol-saves-display">${roll_results}`;
                                content = content.replace(/<div class="midi-qol-saves-display">[\s\S]*<div class="end-midi-qol-saves-display">/g, replaceString);
                                chatMessage.update({ content: content });
                            }
                        }
                    }
                }).render(true);
            }
        };
        if (spells.length > 0 && usesItem.system.uses.value !== usesItem.system.uses.max) buttonList.spellSlot = {    
            icon: '<i class="fas fa-brain"></i>',
            label:  "Sorcery Point(s)",
            callback: () => {
                spells.filter(spell => spell.value > 0).forEach(spell => options += `<option id="${spell.level}" value="${spell.type}">${spell.type === "pact" ? `Pact Magic [Level ${spell.level}]` : `Level ${spell.level}`} (${spell.value}/${spell.max} Slots)</option>`);
                new Dialog({
                    title: "Font of Magic",
                    content: `
                    <form>
                        <p>Choose a Spell Slot to convert:</p>
                        <div class="form-group">
                            <label><b>Spell Slot Level</b></label>
                            <div class="form-fields">
                                <select id="slot" name="slot-level">` + options + `</select>
                            </div>
                        </div>
                    </form>
                    `,
                    buttons: {
                        recover: {
                            icon: '<i class="fas fa-brain"></i>',
                            label: "Convert",
                            callback: async () => {
                                let slot = { type: $("#slot").find(":selected").val(), level: +$("#slot").find(":selected").attr("id") };
                                if (!slot.type || !slot.level) return ui.notifications.warn("No Spell Slot was selected");
                                let spellUpdate = new Object();
                                spellUpdate[`system.spells.${slot.type}.value`] = args[0].actor.system.spells[slot.type].value - 1;
                                await args[0].actor.update(spellUpdate);
                                await usesItem.update({"system.uses.value": usesItem.system.uses.value + slot.level});
                                let roll_results = `<div><i>Converted a Level ${slot.level} spell slot. ${slot.level} Sorcery Points created.</i></div>`;
                                const chatMessage = game.messages.get(args[0].itemCardId);
                                let content = duplicate(chatMessage.content);
                                const replaceString = `<div class="midi-qol-saves-display"><div class="end-midi-qol-saves-display">${roll_results}`;
                                content = content.replace(/<div class="midi-qol-saves-display">[\s\S]*<div class="end-midi-qol-saves-display">/g, replaceString);
                                chatMessage.update({ content: content });
                            }
                        }
                    }
                }).render(true);
            }
        };
        if (!Object.keys(buttonList).length) return ui.notifications.warn("Invalid number of Spell Slots or Sorcery Points");
        new Dialog({
            title: "Font of Magic",
            content: "Convert to the following:",
            buttons: buttonList
        }).render(true);
    } else if (args[0] === "off") {
		let lastArg = args[args.length - 1];
		let tokenOrActor = await fromUuid(lastArg.actorUuid);
		let actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
		let spellUpdate = new Object();
		spellUpdate[`system.spells.${args[1]}.value`] = lastArg["expiry-reason"] === "midi-qol:rest" ? actor.system.spells[args[1]].max : Math.max(0, actor.system.spells[args[1]].value - 1);
		await actor.update(spellUpdate);
	}
} catch (err)  {console.error("Font of Magic Macro - ", err)}