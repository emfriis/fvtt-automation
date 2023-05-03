try {
    const lastArg = args[args.length - 1];
    const token = canvas.tokens.get(lastArg.tokenId);
    const spellItem = await fromUuid(lastArg.efData.origin);

    if (args[0] === "on") {
        const weapons = token.actor.items.filter((i) => i.system.baseItem === "quarterstaff" || i.system.baseItem === "club");
        let weapon_content = "";

        weapons.forEach((weapon) => {
            weapon_content += `<label class="radio-label">
            <input type="radio" name="weapon" value="${weapon.id}">
            <img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">
            ${weapon.name}
            </label>`;
        });

        let content = `
            <style>
            .shillelagh .form-group {
                display: flex;
                flex-wrap: wrap;
                width: 100%;
                align-items: flex-start;
            }

            .shillelagh .radio-label {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                justify-items: center;
                flex: 1 0 25%;
                line-height: normal;
            }

            .shillelagh .radio-label input {
                display: none;
            }

            .shillelagh img {
                border: 0px;
                width: 50px;
                height: 50px;
                flex: 0 0 50px;
                cursor: pointer;
            }

            /* CHECKED STYLES */
            .shillelagh [type=radio]:checked + img {
                outline: 2px solid #f00;
            }
            </style>
            <form class="shillelagh">
            <div class="form-group" id="weapons">
                ${weapon_content}
            </div>
            </form>
        `;

        new Dialog({
            content,
            buttons: {
                ok: {
                    label: `Ok`,
                    callback: async () => {
                        const itemId = $("input[type='radio'][name='weapon']:checked").val();
                        const weaponItem = token.actor.items.get(itemId);
                        let weaponCopy = duplicate(weaponItem);
                        token.actor.setFlag("midi-qol", "shillelagh", {
                            weapon: itemId,
                            ability: weaponCopy.system.ability ? weaponCopy.system.ability : "str",
                            damage : weaponCopy.system.damage.parts[0][0],
                            magic : weaponCopy.system.properties.mgc
                        });
                        let damage = weaponCopy.system.damage.parts[0][0];
                        var newDamage = damage.replace(/1d(4|6)/g,"1d8");
                        weaponCopy.system.damage.parts[0][0] = newDamage;
                        weaponCopy.system.properties.mgc = true;
                        weaponCopy.system.ability = spellItem.system.ability ? spellItem.system.ability : token.actor.system.attributes.spellcasting ? token.actor.system.attributes.spellcasting : "int";
                        weaponCopy.name = "Imbued " + weaponCopy.name;
                        token.actor.updateEmbeddedDocuments("Item", [weaponCopy]);
                    },
                },
                cancel: { label: `Cancel`, },
            },
        }).render(true);
    }

    if (args[0] === "off") {
        const { weapon, ability, damage, magic } = token.actor.getFlag("midi-qol", "shillelagh");
        const weaponItem = token.actor.items.get(weapon);
        let weaponCopy = duplicate(weaponItem);
        weaponCopy.system.ability = ability;
        weaponCopy.name = weaponCopy.name.replace("Imbued ", "");
        weaponCopy.system.damage.parts[0][0] = damage;
        weaponCopy.system.properties.mgc = magic;
        token.actor.updateEmbeddedDocuments("Item", [weaponCopy]);
        token.actor.unsetFlag("midi-qol", "shillelagh");
    }
} catch (err) {
    console.error(`Shillelagh error`, err);
}