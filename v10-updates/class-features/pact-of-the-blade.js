try {
    if (args[0] === "on") {
        const lastArg = args[args.length - 1];
        const tactor = await fromUuid(lastArg.actorUuid);
        const folder = game.folders.getName("Weapons").contents;
        let weapons = [];
        let hexWarrior = tactor.items.find(i => i.name === "Hex Warrior");
        let improved = tactor.items.find(i => i.name === "Invocation: Improved Pact Weapon");
        if (!improved) {
            weapons = folder.filter((i) => i.type === "weapon" && i.system.baseItem && !i.system.properties.ada && !i.system.properties.mgc && !i.system.properties.sil && i.system.actionType === "mwak");
        } else if (improved) {
            weapons = folder.filter((i) => i.type === "weapon" && i.system.baseItem && !i.system.properties.ada && !i.system.properties.mgc && !i.system.properties.sil && (i.system.actionType === "mwak" || ["shortbow", "longbow", "lightcrossbow", "heavycrossbow"].includes(i.system.baseItem)));
        }
        if (weapons == []) return ui.notifications.warn("No Valid Weapons Found");
        const weaponContents = weapons.reduce((acc, target) => acc += `<option value="${target.id}">${target.name}</option>`, "");
        const content = `<p>Pick a weapon</p><form><div class="form-group"><label for="weapon">Weapon:</label><select id="weapon">${weaponContents}</select></div></form>`;
        new Dialog({
            content,
            buttons: {
                confirm: {
                    label: "Confirm",
                    callback: async () => {
                        let itemId = $('#weapon')[0].value;
                        if (!itemId) return ui.notifications.warn("No Weapon Selected");
                        let weaponItem = folder.find(i => i.id === itemId);
                        let copyItem = duplicate(weaponItem);
                        if (improved) {
                            copyItem.system.attackBonus = 1;
                            copyItem.system.damage.parts[0][0] += " + 1"
                            if (copyItem.system.damage.versatile !== "" && copyItem.system.damage.versatile !== null) copyItem.system.damage.versatile += " + 1";
                        }
                        if (hexWarrior) copyItem.system.ability = "cha";
                        copyItem.name = copyItem.name + " (Pact Weapon)";
                        copyItem.system.properties.mgc = true;
                        copyItem.system.equipped = true;
                        copyItem.system.proficient = true;
                        await tactor.createEmbeddedDocuments("Item", [copyItem]);
                        let item = tactor.items.find(i => i.name === copyItem.name);
                        let effect = tactor.effects.find(e => e.label === "Pact of the Blade");
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