try {
    if (args[0] == "on") {
        const lastArg = args[args.length - 1];
		if (lastArg.efData.changes.find(c => c.key == "flags.dae.deleteUuid")) return;
        const tactor = await fromUuid(lastArg.actorUuid);
        const pack = await game.packs.get("dnd5e.items");
        let hexWarrior = tactor.items.find(i => i.name == "Hex Warrior") ? true : false;
        let improved = tactor.items.find(i => i.name == "Invocation: Improved Pact Weapon") ? true : false;
		let weapons = pack.index.contents.filter(i => ["Club", "Dagger", "Greatclub", "Handaxe", "Javelin", "Light Hammer", "Mace", "Quarterstaff", "Sickle", "Spear", "Battleaxe", "Flail", "Glaive", "Greataxe", "Greatsword", "Halberd", "Lance", "Longsword", "Maul", "Morningstar", "Pike", "Rapier", "Scimitar", "Shortsword", "Trident", "War Pick", "Warhammer", "Whip"].includes(i.name) || (improved && ["Shortbow", "Longbow", "Light Crossbow", "Heavy Crossbow"].includes(i.name)));
        const weaponContents = weapons.reduce((acc, target) => acc += `<option value="${target._id}">${target.name}</option>`, "");
        const content = `<p>Pick a weapon</p><form><div class="form-group"><label for="weapon">Weapon:</label><select id="weapon">${weaponContents}</select></div></form>`;
        new Dialog({
            content,
            buttons: {
                confirm: {
                    label: "Confirm",
                    callback: async () => {
                        let itemId = $("#weapon")[0].value;
                        if (!itemId) return ui.notifications.warn("No Weapon Selected");
                        let weaponItem = (await pack.getDocument(itemId))?.toObject();
                        let copyItem = duplicate(weaponItem);
                        if (improved) {
                            copyItem.system.attackBonus = 1;
                            copyItem.system.damage.parts[0][0] += " + 1"
                            if (copyItem.system.damage.versatile != "" && copyItem.system.damage.versatile != null) copyItem.system.damage.versatile += " + 1";
                        }
                        if (hexWarrior) copyItem.system.ability = "cha";
                        copyItem.name = copyItem.name + " (Pact Weapon)";
                        copyItem.system.properties.mgc = true;
                        copyItem.system.equipped = true;
                        copyItem.system.proficient = true;
                        await tactor.createEmbeddedDocuments("Item", [copyItem]);
                        let item = tactor.items.find(i => i.name == copyItem.name);
                        let effect = tactor.effects.find(e => e.label == "Pact of the Blade");
                        if (item && effect) await effect.update({ changes: effect.changes.concat([{ key: "flags.dae.deleteUuid", mode: 5, value: item.uuid, priority: 20 }]) });
                    }
                },
                cancel: {
                    label: "Cancel",
                },
            },
            default: "cancel",
        }).render(true);
    } 
} catch (err) {console.error("Pact of the Blade Macro - ", err);}