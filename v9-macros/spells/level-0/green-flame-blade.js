// green-flame blade
// on use
// damage bonus

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

function sequencerEffect(target, origin = null) {
  if (game.modules.get("sequencer")?.active) {
    if (Sequencer.Database.entryExists("jb2a.chain_lightning.secondary.green")) {
      new Sequence()
        .effect()
        .atLocation(origin)
        .stretchTo(target)
        .file(Sequencer.Database.entryExists("jb2a.chain_lightning.secondary.green"))
        .repeats(1, 200, 300)
        .randomizeMirrorY()
        .play();
    }
  }
}

if (args[0].tag === "OnUse" && lastArg.targets.length === 1) {
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
        title: "Green Flame Blade: Choose a weapon",
        content,
        buttons: {
            Ok: {
                label: "Ok",
                callback: async () => {
                    const itemId = $("input[type='radio'][name='weapon']:checked").val();
                    const weaponItem = tactor.getEmbeddedDocument("Item", itemId);
                    const weaponCopy = duplicate(weaponItem);
                    delete weaponCopy._id;
                    if (cantripDice > 0) {
                        let effectData = {
                        changes: [{ key: "flags.dnd5e.DamageBonusMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.${lastArg.item.name}`, priority: 20, }],
                        origin: lastArg.itemUuid,
                        disabled: false,
                        flags: { dae: { specialDuration: ["1Attack"] }}
                        };
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                    }
                    weaponCopy.name = weaponItem.name + " [Green Flame Blade]";
                    const attackItem = new CONFIG.Item.documentClass(weaponCopy, { parent: tactor });
                    const options = { showFullCard: false, createWorkflow: true, configureDialog: true, targetUuids: [lastArg.targetUuids[0]] };
                    const workflow = await MidiQOL.completeItemRoll(attackItem, options);
                    if (!workflow.hitTargets.size) return;
                    let dialog =  new Promise(async (resolve, reject) => {
                        new Dialog({
                            title: "Green-Flame Blade",
                            content: `<p>Target a creature for the flames to leap to.</p>`,
                            buttons: {
                                Ok: {
                                    label: "Ok",
                                    callback: () => { resolve(Array.from(game.user?.targets)) },
                                },
                            },
                            default: "Ok",
                            close: () => { resolve(false) },
                        }).render(true);
                    });
                    let targets = await dialog;
                    if (!targets || targets[0].document.uuid === lastArg.targetUuids[0]) return;
                    if (MidiQOL.getDistance(workflow.hitTargets[0], targets[0], false) > 5) return ui.notifications.warn("Target too far away");
                    if (targets.length !== 1) return ui.notifications.warn("More than one target selected");
                    const mod = tactor.data.data.abilities[tactor.data.data.attributes.spellcasting].mod;
                    const damageDice = `${cantripDice}d8[fire] + ${mod}`;
                    sequencerEffect(lastArg.targets[0], targets[0]);
                    let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
                    if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, targets[0].id, damageDice, "fire", "magiceffect", "spelleffect");
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
    const cantripDice = 1 + Math.floor((characterLevel + 1) / 6);
	const diceMult = lastArg.isCritical ? 2 : 1;
	return { damageRoll: `${diceMult * (cantripDice - 1)}d8[fire]`, flavor: "Green-Flame Blade" };
}