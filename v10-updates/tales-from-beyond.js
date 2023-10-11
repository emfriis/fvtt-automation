try {
	if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects" && args[0].item.name.toLowerCase().includes("tales from beyond")) {
		const oldEffect = args[0].actor.effects.find(e => e.label.toLowerCase().includes("tales from beyond: tale of the"));
		if (oldEffect) MidiQOL.socket().executeAsGM("removeEffects", {actorUuid: args[0].actor.uuid, effects: [oldEffect.id]});
        const oldItems = args[0].actor.items.filter(i => i.name.toLowerCase().includes("spirit tale: tale of the")).map(i => i.id);
		if (oldItems) args[0].actor.deleteEmbeddedDocuments("Item", [oldItems]);
		const die = args[0].actor.system.scale?.bard?.inspiration ?? "d6";
		let itemData;
		let tale;
        let effects = duplicate(args[0].item.effects);
        console.error("effects", effects);
		if (args[0].damageRoll.dice.length == 1) {
			tale = args[0].damageRoll.dice[0].total;
		} else if (args[0].damageRoll.dice.length == 2) {
			let tales = [ { die: 1, name: "Tale of the Clever Animal" }, { die: 2, name: "Tale of the Renowned Duelist" }, { die: 3, name: "Tale of the Beloved Friends" }, { die: 4, name: "Tale of the Runaway" }, { die: 5, name: "Tale of the Avenger" }, { die: 6, name: "Tale of the Traveller" }, { die: 7, name: "Tale of the Beguiler" }, { die: 8, name: "Tale of the Phantom" }, { die: 9, name: "Tale of the Brute" }, { die: 10, name: "Tale of the Dragon" }, { die: 11, name: "Tale of the Angel" }, { die: 12, name: "Tale of the Mind-Bender" } ];
			let talesChoices = args[0].damageRoll.dice[0].total == args[0].damageRoll.dice[1].total ? tales : tales.filter(t => t.die == args[0].damageRoll.dice[0].total || t.die == args[0].damageRoll.dice[1].total);
			let talesContents = talesChoices.reduce((acc, target) => acc += `<option value="${target.die}">${target.name}</option>`, "");
			let dialog = new Promise(async (resolve) => {
				new Dialog({
					title: "Tales From Beyond",
					content: `<p>Pick a Spirit Tale:</p><form><div class="form-group"><name for="tale">Spirit Tale:</name><select id="tale">${talesContents}</select></div></form>`,
					buttons: {
						Confirm: {
							name: "Confirm",
							callback: async () => { resolve($('#tale')[0].value); }
						},
						Cancel: {
							name: "Cancel",
							callback: async () => { resolve(false); }
						},
					},
					default: "Cancel",
					close: async () => { resolve(false) },
				}).render(true);
			});
			tale = await dialog;
		}	
		switch(tale) {
            case 1:
                itemData = {
                    name: "Spirit Tale: Tale of the Clever Animal",
                    img: "",
                    type: "consumable",
                    system: {
                        consumableType: "trinket",
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 1, type: "creature" },
                        range: { value: 30, units: "ft" },
                        uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                        actionType: "other"
                    },
                    effects: [{
                        changes: [
                            { key: "system.abilities.cha.bonuses.check", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.abilities.int.bonuses.check", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.abilities.wis.bonuses.check", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.skills.his.bonuses.check", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.skills.nat.bonuses.check", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.skills.rel.bonuses.check", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.skills.inv.bonuses.check", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.skills.prc.bonuses.check", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.skills.ins.bonuses.check", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.skills.per.bonuses.check", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.skills.dec.bonuses.check", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.skills.prf.bonuses.check", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.skills.int.bonuses.check", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.skills.itm.bonuses.check", mode: 2, value: `1${die}`, priority: "20" }
                        ],
                        disabled: false,
                        icon: "",
                        name: "Spirit Tale: Tale of the Clever Animal",
                        transfer: false,
                        duration: { seconds: 600 },
                        flags: { dae: { transfer: false } }
                    }],
                    flags: { "midi-qol": { onUseMacroName: "[postActiveEffects]ItemMacro.Tales from Beyond", onUseMacroParts: { items: [{ macroName: "ItemMacro.Tales from Beyond", option: "postActiveEffects" }] } } }
                };
                await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
                break;
            case 2:
                itemData = {
                    name: "Spirit Tale: Tale of the Renowned Duelist",
                    img: "",
                    type: "consumable",
                    system: {
                        consumableType: "trinket",
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 1, type: "creature" },
                        range: { value: 5, units: "ft" },
                        uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                        actionType: "msak",
                        damage: { parts: [[`2${die} + @abilities.cha.mod`, "force"]] }
                    }
                }
                await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
                break;
            case 3:
                itemData = {
                    name: "Spirit Tale: Tale of the Beloved Friends",
                    img: "",
                    type: "consumable",
                    system: {
                        consumableType: "trinket",
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 2, type: "creature" },
                        range: { value: 30, units: "ft" },
                        uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                        actionType: "heal",
                        damage: { parts: [[`1${die} + @abilities.cha.mod`, "temphp"]] },
                    }
                }
                await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
                break;
            case 4:
                itemData = {
                    name: "Spirit Tale: Tale of the Runaway",
                    img: "",
                    type: "consumable",
                    system: {
                        consumableType: "trinket",
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 1, type: "creature" },
                        range: { value: 30, units: "ft" },
                        uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                        actionType: "other"
                    }
                }
                await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
                break;
            case 5:
                itemData = {
                    name: "Spirit Tale: Tale of the Avenger",
                    img: "",
                    type: "consumable",
                    system: {
                        consumableType: "trinket",
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 1, type: "creature" },
                        range: { value: 30, units: "ft" },
                        uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                        actionType: "other"
                    },
                    effects: [{ 
                        disabled: false,
                        icon: "",
                        name: "Spirit Tale: Tale of the Avenger",
                        transfer: false,
                        duration: { seconds: 60 },
                        flags: { dae: { transfer: false } }
                    }],
                    flags: { "midi-qol": { onUseMacroName: "[postActiveEffects]ItemMacro.Tales from Beyond", onUseMacroParts: { items: [{ macroName: "ItemMacro.Tales from Beyond", option: "postActiveEffects" }] } } }
                };
                await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
                break;
            case 6: //WIP - EFFECT MACROS? FOR REMOVING EFFECT ON 0 TEMPHP
                itemData = {
                    name: "Spirit Tale: Tale of the Traveller",
                    img: "",
                    type: "consumable",
                    system: {
                        consumableType: "trinket",
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 1, type: "creature" },
                        range: { value: 30, units: "ft" },
                        uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                        actionType: "other"
                    },
                    effects: [{ 
                        changes: [
                            { key: "", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "", mode: 2, value: `1${die}`, priority: "20" }
                        ],
                        disabled: false,
                        icon: "",
                        name: "Spirit Tale: Tale of the Traveller",
                        transfer: false,
                        flags: { dae: { specialDuration: ["turnStartSource"], transfer: false }, core: { statusId: "Spirit Tale: Tale of the Traveller" } }
                    }],
                    flags: { "midi-qol": { onUseMacroName: "[postActiveEffects]ItemMacro.Tales from Beyond", onUseMacroParts: { items: [{ macroName: "ItemMacro.Tales from Beyond", option: "postActiveEffects" }] } } }
                };
                await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
                break;
            case 7:
                itemData = {
                    name: "Spirit Tale: Tale of the Beguiler",
                    img: "",
                    type: "consumable",
                    system: {
                        consumableType: "trinket",
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 1, type: "creature" },
                        range: { value: 30, units: "ft" },
                        uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                        actionType: "save",
                        save: { ability: "wis", scaling: "spell" },
                        damage: { parts: [[`2${die} + @abilities.cha.mod`, "psychic"]] }
                    },
                    effects: [{
                        changes: [{ key: "macro.CE", mode: 0, value: "Incapacitated", priority: "20" }],
                        disabled: false,
                        icon: "",
                        name: "Spirit Tale: Tale of the Beguiler",
                        transfer: false,
                        duration: { rounds: 1 },
                        flags: { dae: { specialDuration: ["turnEnd"], transfer: false }, core: { statusId: "Spirit Tale: Tale of the Beguiler" } }
                    }],
                    flags: { "midi-qol": { onUseMacroName: "[postActiveEffects]ItemMacro.Tales from Beyond", onUseMacroParts: { items: [{ macroName: "ItemMacro.Tales from Beyond", option: "postActiveEffects" }] } }, flags: { midiProperties: { magiceffect: true } } }
                }
                await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
                break;
            case 8:
                itemData = { 
                    name: "Spirit Tale: Tale of the Phantom",
                    img: "",
                    type: "consumable",
                    system: {
                        consumableType: "trinket",
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 1, type: "creature" },
                        range: { value: 30, units: "ft" },
                        uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                        actionType: "other"
                    },
                    effects: [{
                        changes: [
                            { key: "macro.CE", mode: 0, value: "Invisible", priority: "20" },
                            { key: "system.bonuses.mwak.damage", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.bonuses.rwak.damage", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.bonuses.msak.damage", mode: 2, value: `1${die}`, priority: "20" },
                            { key: "system.bonuses.rsak.damage", mode: 2, value: `1${die}`, priority: "20" }
                        ],
                        disabled: false,
                        icon: "",
                        name: "Spirit Tale: Tale of the Phantom",
                        transfer: false,
                        duration: { rounds: 1 },
                        flags: { 
                            taleOfThePhantom: args[0].actor.uuid,
                            dae: { specialDuration: ["turnEnd", "1Hit"], transfer: false }, 
                            effectmacro: { dnd5e: { rollDamage: { script: 'workflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);\nif (!["mwak","rwak","msak","rsak"].includes(workflow.item.system.actionType) || !workflow.hitTargets.size) return;\nconst effectTarget = workflow.hitTargets.values().next().value.actor;\nconst effectData = { changes: [{ key: "macro.CE", mode: 0, value: "Frightened", priority: 20 }], disabled: false, icon: "", name: "Tale of the Phantom", duration: { rounds: 1 }, flags: { dae: { specialDuration: ["turnEnd"] } } };\nawait MidiQOL.socket().executeAsGM("createEffects", { actorUuid: effectTarget.uuid, effects: [effectData] });\nconst targetEffect = effectTarget.effects.find(e => e.label == "Tale of the Phantom");\nconst source = await fromUuid(actor.effects.find(e => e.flags.taleOfThePhantom).flags.taleOfThePhantom);\nconst sourceEffect = source.effects.find(e => e.label.toLowerCase().includes("tales from beyond: tale of the"));\nawait MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: source.uuid, updates: [{ _id: sourceEffect.id, changes: sourceEffect.changes.push([{ key: "flags.dae.deleteUuid", mode: 5, value: `${targetEffect.uuid}`, priority: 20 }]) }] });' } } }
                        }
                    }],
                    flags: { "midi-qol": { onUseMacroName: "[postActiveEffects]ItemMacro.Tales from Beyond", onUseMacroParts: { items: [{ macroName: "ItemMacro.Tales from Beyond", option: "postActiveEffects" }] } } }
                };
                await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
                break;
            case 9:
                itemData = {
                    name: "Spirit Tale: Tale of the Brute",
                    img: "",
                    type: "consumable",
                    system: {
                        consumableType: "trinket",
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 30, units: "ft", type: "radius" },
                        range: { value: 5, units: "ft" },
                        uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                        actionType: "save",
                        save: { ability: "str", scaling: "spell" },
                        damage: { parts: [[`3${die}`, "thunder"]] }
                    },
                    effects: [{
                        changes: [{ key: "macro.CE", mode: 0, value: "Prone", priority: "20" }],
                        disabled: false,
                        icon: "",
                        name: "Prone",
                        transfer: false
                    }],
                    flags: { "midi-qol": { onUseMacroName: "[preambleComplete]ItemMacro.Tales from Beyond", onUseMacroParts: { items: [{ macroName: "ItemMacro.Tales from Beyond", option: "preambleComplete" }] } }, midiProperties: { halfdam: true, magiceffect: true } }
                }
                await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
                break;
            case 10:
                itemData = {
                    name: "Spirit Tale: Tale of the Dragon",
                    img: "",
                    type: "consumable",
                    system: {
                        consumableType: "trinket",
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 30, units: "ft", type: "cone" },
                        range: { value: 5, units: "ft" },
                        uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                        actionType: "save",
                        save: { ability: "dex", scaling: "spell" },
                        damage: { parts: [[`4${die}`, "fire"]] }
                    },
                    flags: { midiProperties: { halfdam: true, magiceffect: true } }
                }
                await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
                break;
            case 11:
                itemData = {
                    name: "Spirit Tale: Tale of the Angel",
                    img: "",
                    type: "consumable",
                    system: {
                        consumableType: "trinket",
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 1, type: "creature" },
                        range: { value: 30, units: "ft" },
                        uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                        actionType: "heal",
                        damage: { parts: [[`2${die} + @abilities.cha.mod`, "healing"]] },
                        chatFlavor: "The target is cured of one of the following conditions: blinded, deafened, paralyzed, petrified, or poisoned"
                    }
                }
                await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
                break;
            case 12:
                itemData = {
                    name: "Spirit Tale: Tale of the Mind-Bender",
                    img: "",
                    type: "consumable",
                    system: {
                        consumableType: "trinket",
                        activation: { type: "bonus", cost: 1 },
                        target: { value: 1, type: "creature" },
                        range: { value: 30, units: "ft" },
                        uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                        actionType: "save",
                        save: { ability: "int", scaling: "spell" },
                        damage: { parts: [[`3${die} + @abilities.cha.mod`, "psychic"]] }
                    },
                    effects: [{
                        changes: [{ key: "macro.CE", mode: 0, value: "Stunned", priority: "20" }],
                        disabled: false,
                        icon: "",
                        name: "Spirit Tale: Tale of the Mind-Bender",                        
                        transfer: false,
                        duration: { rounds: 1 },
                        flags: { dae: { specialDuration: ["turnEnd"], transfer: false }, core: { statusId: "Spirit Tale: Tale of the Mind-Bender" } }
                    }],
                    flags: { "midi-qol": { onUseMacroName: "[postActiveEffects]ItemMacro.Tales from Beyond", onUseMacroParts: { items: [{ macroName: "ItemMacro.Tales from Beyond", option: "postActiveEffects" }] } }, midiProperties: { magiceffect: true } }
                }
                await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
                break;
            default:
                ui.notifications.warn("Invalid Bardic Die Result");
		}
		const item = args[0].actor.items.find(i => i.name == itemData.name);
		const effectData = {
            changes: [{ key: "flags.dae.deleteUuid", mode: 5, value: `${item.uuid}`, priority: 20 }],
            disabled: false,
            icon: item.img,
            name: "Tales From Beyond: " + item.name.replace("Spirit Tale: ", ""),
			flags: { dae: { specialDuration: ["shortRest", "longRest"] } }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
	} else if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects" && !args[0].item.name.toLowerCase().includes("tales from beyond")) {
		const effect = args[0].actor.effects.find(e => e.label.toLowerCase().includes("tales from beyond: tale of the "));
        console.error("effect", effect);
		const targetEffect = args[0].targets[0].actor.effects.find(e => e.label.toLowerCase().includes(`spirit tale: ${effect.label.toLowerCase().replace("tales from beyond: ", "")}`));
        console.error("targetEffect", targetEffect);
		if (effect && targetEffect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, changes: effect.changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: `${targetEffect.uuid}`, priority: 20 }]) }] });
	} else if (args[0].tag == "OnUse" && args[0].macroPass == "preambleComplete" && !args[0].item.name.toLowerCase().includes("tales from beyond")) {
		game.user.updateTokenTargets(args[0].targets.filter(t => t.disposition == -canvas.tokens.get(args[0].tokenId).document.disposition).map(t => t.id));
	}
} catch (err) {console.error("Tales from Beyond Macro - ", err)}