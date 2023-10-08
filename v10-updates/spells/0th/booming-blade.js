try {
    if (args[0].tag === "OnUse") {
        const attacker = canvas.tokens.get(args[0].tokenId);
        const characterLevel = attacker.actor.type === "character" ? attacker.actor.system.details.level : attacker.actor.system.details.cr;
        const cantripDice = Math.floor((characterLevel + 1) / 6) + 1;
        const filteredWeapons = attacker.actor.items.filter((i) => i.data.type === "weapon" && i.system.equipped && i.system.activation.type === "action" && i.system.actionType == "mwak");
        let weapon_content = "";
        filteredWeapons.forEach((weapon) => {
            weapon_content += `<label class="radio-label">
            <input type="radio" name="weapon" value="${weapon.id}">
            <img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">
            ${weapon.data.name}
            </label>`;
        });
        let content = `
            <style>
            .weapon .form-group {
                display: flex;
                flex-wrap: wrap;
                width: 100%;
                align-items: flex-start;
            }
            .weapon .radio-label {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                justify-items: center;
                flex: 1 0 25%;
                line-height: normal;
            }
            .weapon .radio-label input {
                display: none;
            }
            .weapon img {
                border: 0px;
                width: 50px;
                height: 50px;
                flex: 0 0 50px;
                cursor: pointer;
            }
            /* CHECKED STYLES */
            .weapon [type=radio]:checked + img {
                outline: 2px solid #f00;
            }
            </style>
            <form class="weapon">
            <div class="form-group" id="weapons">
                ${weapon_content}
            </div>
            </form>
        `;
        new Dialog({
            title: "Booming Blade: Choose a weapon",
            content,
            buttons: {
                Ok: {
                    label: "Ok",
                    callback: async () => {
                        const itemId = $("input[type='radio'][name='weapon']:checked").val();
                        const weaponItem = attacker.actor.getEmbeddedDocument("Item", itemId);
                        const weaponCopy = duplicate(weaponItem);
                        weaponCopy.effects.push({
                            changes: [{ key: "macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro ${cantripDice}d8`, priority: "20", }],
                            disabled: false,
                            icon: args[0].item.img,
                            label: args[0].item.name,
                            origin : args[0].uuid,
                            transfer: false,
                            flags: { dae: { itemData: args[0].item.system, specialDuration: ["turnStartSource", "isMoved"], transfer: false, stackable: "noneName" }, core: { statusId: args[0].item.name, }, },
                        });
                        if (cantripDice > 1) weaponCopy.system.damage.parts.push([`${cantripDice - 1}d8`, "thunder"]);
                        const attackItem = new CONFIG.Item.documentClass(weaponCopy, { parent: attacker.actor });
                        const options = { showFullCard: false, createWorkflow: true, configureDialog: true, targetUuids: [args[0].targetUuids[0]] };
                        await MidiQOL.completeItemRoll(attackItem, options);
                    },
                },
                Cancel: { label: "Cancel" },
            },
        }).render(true);
    }

    const lastArg = args[args.length - 1];
    if (args[0] === "off" && lastArg["expiry-reason"] === "midi-qol:isMoved") {
        const target = canvas.tokens.get(lastArg.tokenId);
        const damageItemData = {
            name: "Booming Blade",
            img: "icons/skills/melee/blade-tip-orange.webp",
            type: "feat",
            flags: { midiProperties: { magiceffect: true, spelleffect: true, } },
            system: {
                activation: { type: "none", },
                target: { type: "self", },
                actionType: "other",
                damage: { parts: [[args[1], "thunder"]] }
            }
        }
        const damageItem = new CONFIG.Item.documentClass(damageItemData, { parent: target.actor });
        const options = { showFullCard: false, createWorkflow: true, configureDialog: true };
        await MidiQOL.completeItemRoll(damageItem, options);
    }
} catch (err) {
    console.error(`Booming Blade error`, err);
}