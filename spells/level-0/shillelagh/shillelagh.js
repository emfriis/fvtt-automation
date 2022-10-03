// shillelagh

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const DAEItem = lastArg.efData.flags.dae.itemData;

/**
 * Select for weapon
 */
if (args[0] === "on") {
    const weapons = tactor.items.filter((i) => i.data.data.baseItem === "quarterstaff" || i.data.data.baseItem === "club");
    let weapon_content = "";

    //Filter for weapons
    weapons.forEach((weapon) => {
        weapon_content += `<label class="radio-label">
    <input type="radio" name="weapon" value="${weapon.id}">
    <img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">
    ${weapon.data.name}
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
            callback: (html) => {
                const itemId = $("input[type='radio'][name='weapon']:checked").val();
                const weaponItem = tactor.items.get(itemId);
                let copyItem = duplicate(weaponItem);
                DAE.setFlag(tactor, "shillelagh", {
                    weapon: itemId,
                        ability: copyItem.data.ability,
                        damage : copyItem.data.damage.parts[0][0]
                });
                if (copyItem.data.attackBonus === "") copyItem.data.attackBonus = "0";
                let damage = copyItem.data.damage.parts[0][0];
                var newDamage = damage.replace(/1d(4|6)/g,"1d8");
                copyItem.data.damage.parts[0][0] = newDamage;
                copyItem.data.ability = tactor.data.data.attributes.spellcasting;
                copyItem.name = "Imbued " + copyItem.name;
                tactor.updateEmbeddedDocuments("Item", [copyItem]);
            },
        },
        cancel: {
            label: `Cancel`,
        },
        },
    }).render(true);
}

//Revert weapon and unset flag.
if (args[0] === "off") {
    try {
        const { weapon, ability, damage } = DAE.getFlag(tactor, "shillelagh");
        const weaponItem = tactor.items.get(weapon);
        let copyItem = duplicate(weaponItem);
        copyItem.data.ability = ability;
        copyItem.name = copyItem.name.replace("Imbued ", "");
        copyItem.data.damage.parts[0][0] = damage;
        tactor.updateEmbeddedDocuments("Item", [copyItem]);
        DAE.unsetFlag(tactor, "shillelagh");
    } catch (err) {
        console.error('shillelagh macro error');
    }
}