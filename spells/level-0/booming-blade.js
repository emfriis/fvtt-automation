// booming blade
// on use
// damage bonus

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

function sequencerEffect(target) {
    if (game.modules.get("sequencer")?.active && hasProperty(Sequencer.Database.entries, "jb2a")) {
      new Sequence().effect().file("jb2a.static_electricity.01.blue").atLocation(target).scaleToObject(1.5).play();
    }
  }

if (args[0].tag === "OnUse") {
    const characterLevel = tactor.data.type === "character" ? tactor.data.data.details.level : tactor.data.data.details.cr;
    const cantripDice = Math.floor((characterLevel + 1) / 6);

    const filteredWeapons = tactor.items.filter((i) => i.data.type === "weapon" && i.data.data.equipped && i.data.data.activation.type === "action" && i.data.data.actionType == "mwak");
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
                    const weaponItem = tactor.getEmbeddedDocument("Item", itemId);
                    const weaponCopy = duplicate(weaponItem);
                    delete weaponCopy._id;
                    weaponCopy.name = weaponItem.name + " [Booming Blade]";
                    weaponCopy.effects.push({
                        changes: [{ key: "macro.itemMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `${cantripDice + 1}d8`, priority: "20", }],
                        disabled: false,
                        icon: lastArg.item.img,
                        label: lastArg.item.name,
                        origin : lastArg.uuid,
                        transfer: false,
                        flags: { dae: { specialDuration: ["turnStartSource", "isMoved"], transfer: false, }, core: { statusId: lastArg.item.name, }, },
                    });
                    setProperty(weaponCopy, "flags.itemacro", duplicate(lastArg.itemData.flags.itemacro));
                    setProperty(weaponCopy, "flags.midi-qol.effectActivation", false);
                    const attackItem = new CONFIG.Item.documentClass(weaponCopy, { parent: tactor });
                    for (let t = 0; t < lastArg.targets.length; t++) {
                        if (cantripDice > 1) {
                            let effectData = {
                            changes: [{ key: "flags.dnd5e.DamageBonusMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.${lastArg.item.name}`, priority: 20, }],
                            origin: lastArg.uuid,
                            disabled: false,
                            flags: { dae: { specialDuration: ["1Attack"] }}
                            };
                            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                        }
                        const options = { showFullCard: false, createWorkflow: true, configureDialog: true, targets: [lastArg.targetUuids[t]] };
                        await MidiQOL.completeItemRoll(attackItem, options);
                    }
                },
            },
            Cancel: {
                label: "Cancel",
            },
        },
    }).render(true);
}

if (args[0].tag === "DamageBonus") {
    const characterLevel = tactor.data.type === "character" ? tactor.data.data.details.level : tactor.data.data.details.cr;
    const cantripDice = Math.floor((characterLevel + 1) / 6);
	  const diceMult = lastArg.isCritical ? 2 : 1;
	  return { damageRoll: `${diceMult * (cantripDice - 1)}d8[thunder]`, flavor: "Booming Blade" };
}

if (args[0] === "on") {
    const targetToken = canvas.tokens.get(lastArg.tokenId);
    sequencerEffect(targetToken);
} else if (args[0] === "off" && lastArg["expiry-reason"] === "midi-qol:isMoved") {
    const targetToken = canvas.tokens.get(lastArg.tokenId);
    let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
    if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, lastArg.tokenId, args[1], "thunder", "magiceffect", "spelleffect");
    sequencerEffect(targetToken);
}