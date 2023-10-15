try {
	if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects" && args[0].item.name.toLowerCase().includes("tales from beyond")) {
        const oldItems = args[0].actor.items.filter(i => i.name.toLowerCase().includes("spirit tale: ")).map(i => i.id);
        if (oldItems) await args[0].actor.deleteEmbeddedDocuments("Item", oldItems);
		const oldEffect = args[0].actor.effects.find(e => e.label.toLowerCase().includes("tales from beyond: tale of the"));
		if (oldEffect) await MidiQOL.socket().executeAsGM("removeEffects", {actorUuid: args[0].actor.uuid, effects: [oldEffect.id]});
		const die = args[0].actor.system.scale?.bard?.inspiration ?? "d6";
		let tale;
		if (args[0].damageRoll.dice[0].results.length == 1) {
			tale = args[0].damageRoll.dice[0].results[0].result;
            await createTale(tale, die);
		} else if (args[0].damageRoll.dice[0].results.length == 2) {
			let tales = [ { die: 1, name: "Tale of the Clever Animal" }, { die: 2, name: "Tale of the Renowned Duelist" }, { die: 3, name: "Tale of the Beloved Friends" }, { die: 4, name: "Tale of the Runaway" }, { die: 5, name: "Tale of the Avenger" }, { die: 6, name: "Tale of the Traveller" }, { die: 7, name: "Tale of the Beguiler" }, { die: 8, name: "Tale of the Phantom" }, { die: 9, name: "Tale of the Brute" }, { die: 10, name: "Tale of the Dragon" }, { die: 11, name: "Tale of the Angel" }, { die: 12, name: "Tale of the Mind-Bender" } ];
			let talesChoices = args[0].damageRoll.dice[0].results[0].result == args[0].damageRoll.dice[0].results[1].result ? tales : tales.filter(t => t.die == args[0].damageRoll.dice[0].results[0].result || t.die == args[0].damageRoll.dice[0].results[1].result);
			let talesContents = talesChoices.reduce((acc, target) => acc += `<option value="${target.die}">${target.name}</option>`, "");
			new Dialog({
                title: "Tales From Beyond",
                content: `<p>Pick a Spirit Tale:</p><form><div class="form-group"><name for="tale">Spirit Tale:</name><select id="tale">${talesContents}</select></div></form>`,
                buttons: {
                    Confirm: { label: "Confirm", callback: async () => { await createTale(+$('#tale')[0].value, die); } },
                    Cancel: { label: "Cancel", callback: async () => { resolve(false); } }
                },
                default: "Cancel",
            }).render(true);
		}	
	} else if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects" && !args[0].item.name.toLowerCase().includes("tales from beyond")) {
		const effect = args[0].actor.effects.find(e => e.label.toLowerCase().includes("tales from beyond: tale of the "));
		const targetEffect = args[0].targets[0].actor.effects.find(e => e.label.toLowerCase().includes(`spirit tale: ${effect.label.toLowerCase().replace("tales from beyond: ", "")}`));
		if (effect && targetEffect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: effect.id, changes: effect.changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: `${targetEffect.uuid}`, priority: 20 }]) }] });
        if (targetEffect.label.toLowerCase().includes("traveller")) {
            let hook = Hooks.on("preUpdateActor", async (actor, changes) => {
                if (actor.uuid == args[0].actor.uuid && actor.effects.find(e => e.label.toLowerCase().includes("spirit tale: tale of the traveller")) && ((changes.system.attributes.hp.temp < 1 || (actor.system.attributes.hp.temp < changes.system.attributes.hp.temp && 0 < actor.system.attributes.hp.temp)))) {
                    const effect = actor.effects.find(e => e.label.toLowerCase().includes("spirit tale: tale of the traveller"));
                    if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: actor.uuid, effects: [effect.id] });
                    Hooks.off("preUpdateActor", hook);
                } 
            });
        }
    } else if (args[0].tag == "OnUse" && args[0].macroPass == "preambleComplete" && !args[0].item.name.toLowerCase().includes("tales from beyond")) {
		game.user.updateTokenTargets(args[0].targets.filter(t => t.disposition == -canvas.tokens.get(args[0].tokenId).document.disposition).map(t => t.id));
	}
} catch (err) {console.error("Tales from Beyond Macro - ", err)}

async function createTale (tale, die) { 
    console.error(tale);
    let itemData;
    switch(tale) {
        case 1:
            itemData = {
                name: "Spirit Tale: Tale of the Clever Animal",
                img: "icons/creatures/abilities/paw-print-pair-purple.webp",
                type: "consumable",
                system: {
                    consumableType: "trinket",
                    equipped: true,
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
                    isSuppressed: false,
                    icon: "icons/creatures/abilities/paw-print-pair-purple.webp",
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
                img: "icons/weapons/swords/sword-runed-glowing.webp",
                type: "consumable",
                system: {
                    consumableType: "trinket",
                    equipped: true,
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
                img: "icons/magic/light/explosion-star-glow-silhouette.webp",
                type: "consumable",
                system: {
                    consumableType: "trinket",
                    equipped: true,
                    activation: { type: "bonus", cost: 1 },
                    target: { value: 2, type: "creature" },
                    range: { value: 30, units: "ft" },
                    uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                    actionType: "healing",
                    damage: { parts: [[`1${die} + @abilities.cha.mod`, "temphp"]] }
                },
                effects: [{ 
                    changes: [{ key: "system.attributes.ac.bonus", mode: 0, value: '@actorUuid number "[[@damage]]" system.attributes.hp.temp "0"', priority: "20" }],
                    disabled: false,
                    isSuppressed: false,
                    icon: "icons/magic/light/explosion-star-glow-silhouette.webp",
                    name: "Spirit Tale: Tale of the Beloved Friends",
                    transfer: false,
                    flags: { dae: { transfer: false } }
                }],
                flags: { "midi-qol": { onUseMacroName: "[postActiveEffects]ItemMacro.Tales from Beyond", onUseMacroParts: { items: [{ macroName: "ItemMacro.Tales from Beyond", option: "postActiveEffects" }] } } }
            }
            await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
            break;
        case 4:
            itemData = {
                name: "Spirit Tale: Tale of the Runaway",
                img: "icons/creatures/fish/fish-fangtooth-skeletal-pink.webp",
                type: "consumable",
                system: {
                    consumableType: "trinket",
                    equipped: true,
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
                img: "icons/skills/melee/spear-tips-double-purple.webp",
                type: "consumable",
                system: {
                    consumableType: "trinket",
                    equipped: true,
                    activation: { type: "bonus", cost: 1 },
                    target: { value: 1, type: "creature" },
                    range: { value: 30, units: "ft" },
                    uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                    actionType: "other"
                },
                effects: [{ 
                    disabled: false,
                    isSuppressed: false,
                    icon: "icons/skills/melee/spear-tips-double-purple.webp",
                    name: "Spirit Tale: Tale of the Avenger",
                    transfer: false,
                    duration: { seconds: 60 },
                    flags: { dae: { transfer: false } }
                }],
                flags: { "midi-qol": { onUseMacroName: "[postActiveEffects]ItemMacro.Tales from Beyond", onUseMacroParts: { items: [{ macroName: "ItemMacro.Tales from Beyond", option: "postActiveEffects" }] } } }
            };
            await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
            break;
        case 6:
            itemData = {
                name: "Spirit Tale: Tale of the Traveller",
                img: "icons/skills/movement/arrow-down-pink.webp",
                type: "consumable",
                system: {
                    consumableType: "trinket",
                    equipped: true,
                    activation: { type: "bonus", cost: 1 },
                    target: { value: 1, type: "creature" },
                    range: { value: 30, units: "ft" },
                    uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                    actionType: "healing",
                    damage: { parts: [[`1${die} + @classes.bard.levels`, "temphp"]] },
                },
                effects: [{ 
                    changes: [
                        { key: "system.attributes.ac.bonus", mode: 0, value: '@actorUuid number "[[@damage]]" system.attributes.hp.temp "0"', priority: "20" },
                        { key: "system.attributes.ac.bonus", mode: 2, value: "1", priority: "20" },
                        { key: "system.attributes.movement.walk", mode: 2, value: "10", priority: "20" }
                    ],
                    disabled: false,
                    isSuppressed: false,
                    icon: "icons/skills/movement/arrow-down-pink.webp",
                    name: "Spirit Tale: Tale of the Traveller",
                    transfer: false,
                    flags: { dae: { specialDuration: ["turnStartSource"], transfer: false, showIcon: true } }
                }],
                flags: { "midi-qol": { onUseMacroName: "[postActiveEffects]ItemMacro.Tales from Beyond", onUseMacroParts: { items: [{ macroName: "ItemMacro.Tales from Beyond", option: "postActiveEffects" }] } } }
            };
            await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
            break;
        case 7:
            itemData = {
                name: "Spirit Tale: Tale of the Beguiler",
                img: "icons/creatures/eyes/void-single-black-purple.webp",
                type: "consumable",
                system: {
                    consumableType: "trinket",
                    equipped: true,
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
                    isSuppressed: false,
                    icon: "icons/creatures/eyes/void-single-black-purple.webp",
                    name: "Spirit Tale: Tale of the Beguiler",
                    transfer: false,
                    duration: { rounds: 1 },
                    flags: { dae: { specialDuration: ["turnEnd"], transfer: false } }
                }],
                flags: { "midi-qol": { onUseMacroName: "[postActiveEffects]ItemMacro.Tales from Beyond", onUseMacroParts: { items: [{ macroName: "ItemMacro.Tales from Beyond", option: "postActiveEffects" }] } }, midiProperties: { magiceffect: true } }
            }
            await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
            break;
        case 8:
            itemData = { 
                name: "Spirit Tale: Tale of the Phantom",
                img: "icons/creatures/magical/humanoid-silhouette-glowing-pink.webp",
                type: "consumable",
                system: {
                    consumableType: "trinket",
                    equipped: true,
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
                    isSuppressed: false,
                    icon: "icons/creatures/magical/humanoid-silhouette-glowing-pink.webp",
                    name: "Spirit Tale: Tale of the Phantom",
                    transfer: false,
                    duration: { rounds: 1 },
                    flags: { dae: { specialDuration: ["turnEnd", "1Hit"], transfer: false }, effectmacro: { dnd5e: { rollDamage: { script: `try {\nworkflow = MidiQOL.Workflow.getWorkflow(this.item.uuid);\nif (!["mwak","rwak","msak","rsak"].includes(workflow.item.system.actionType) || !workflow.hitTargets.size) return;\nconst effectTarget = workflow.hitTargets.values().next().value.actor;\nconst effectData = { changes: [{ key: "macro.CE", mode: 0, value: "Frightened", priority: 20 }], disabled: false, icon: "icons/creatures/magical/humanoid-silhouette-glowing-pink.webp", name: "Tale of the Phantom", duration: { rounds: 1 }, flags: { dae: { specialDuration: ["turnEnd"] } } };\nawait MidiQOL.socket().executeAsGM("createEffects", { actorUuid: effectTarget.uuid, effects: [effectData] });\nconst targetEffect = effectTarget.effects.find(e => e.label == "Tale of the Phantom");\nconst source = await fromUuid("${args[0].actor.uuid}");\nconst sourceEffect = source.effects.find(e => e.label.toLowerCase().includes("tales from beyond: tale of the"));\nawait MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: source.uuid, updates: [{ _id: sourceEffect.id, changes: sourceEffect.changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: ${"`${targetEffect.uuid}`"}, priority: 20 }]) }] });\n} catch (err) {console.error("Spirit Tale: Tale of the Phantom Macro - ", err)}` } } } }
                }],
                flags: { "midi-qol": { onUseMacroName: "[postActiveEffects]ItemMacro.Tales from Beyond", onUseMacroParts: { items: [{ macroName: "ItemMacro.Tales from Beyond", option: "postActiveEffects" }] } } }
            };
            await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
            break;
        case 9:
            itemData = {
                name: "Spirit Tale: Tale of the Brute",
                img: "icons/creatures/claws/claw-talons-glowing-purple.webp",
                type: "consumable",
                system: {
                    consumableType: "trinket",
                    equipped: true,
                    activation: { type: "bonus", cost: 1 },
                    target: { value: 30, units: "ft", type: "radius" },
                    range: { value: 5, units: "ft" },
                    uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
                    actionType: "save",
                    save: { ability: "str", scaling: "spell" },
                    damage: { parts: [[`3${die}`, "thunder"]] }
                },
                effects: [{
                    changes: [{ key: "StatusEffect", mode: 0, value: "Convenient Effect: Prone", priority: "20" }],
                    disabled: false,
                    isSuppressed: false,
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
                img: "icons/creatures/abilities/dragon-breath-purple.webp",
                type: "consumable",
                system: {
                    consumableType: "trinket",
                    equipped: true,
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
                img: "icons/creatures/mammals/bat-giant-tattered-purple.webp",
                type: "consumable",
                system: {
                    consumableType: "trinket",
                    equipped: true,
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
                img: "icons/creatures/tentacles/tentacles-octopus-black-pink.webp",
                type: "consumable",
                system: {
                    consumableType: "trinket",
                    equipped: true,
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
                    isSuppressed: false,
                    icon: "icons/creatures/tentacles/tentacles-octopus-black-pink.webp",
                    name: "Spirit Tale: Tale of the Mind-Bender",                        
                    transfer: false,
                    duration: { rounds: 1 },
                    flags: { dae: { specialDuration: ["turnEnd"], transfer: false } }
                }],
                flags: { "midi-qol": { onUseMacroName: "[postActiveEffects]ItemMacro.Tales from Beyond", onUseMacroParts: { items: [{ macroName: "ItemMacro.Tales from Beyond", option: "postActiveEffects" }] } }, midiProperties: { magiceffect: true } }
            }
            await args[0].actor.createEmbeddedDocuments("Item", [itemData]);
            break;
        default:
            ui.notifications.warn("Invalid Bardic Die Result");a
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
}