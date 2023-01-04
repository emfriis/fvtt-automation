// healing light
// on use any pre damage roll

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse") {
    const item = await fromUuid(lastArg.uuid);
    const itemUses = item.data.data.uses;
    if (!itemUses.value || !itemUses.max) return;

    const target = canvas.tokens.get(args[0].targets[0].id);
    const content = `<div style="vertical-align:top;display:flex;"><img src="${target.data.img}" style="border:none;" height="30" width="30"></div><hr><form class="flexcol"><div class="form-group"><label for="num"><b>[${itemUses.value}/${itemUses.max}]</b> additional dice to spend:</span></label><input id="num" name="num" type="number" min="0" max="${itemUses.max}" value="0"></input></div></form>`;
    let dialog = new Promise((resolve, reject) => {
        new Dialog({
            title: lastArg.item.name + ": Spend Additional Dice?",
            content: content,
            buttons: { heal: { icon: '<i class="fas fa-check"></i>', label: 'Heal', callback: async (html) => { resolve(Math.floor(Number(html.find('#num')[0].value))); } } },
            default: "heal"
        }).render(true);
    });
    const dice = await dialog;
    if (!dice) return;
    if (dice > itemUses.max) {
        return ui.notifications.warn(`Invalid number of charges entered (${dice})`);
    } else {
        const effectData = [{
            changes: [{ key: `flags.dnd5e.DamageBonusMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro`, priority: 20 }],
            flags: { "dae": { itemData: item.data }, dice: dice },
            disabled: false,
            label: "Healing Light Bonus Dice"
        }];
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: effectData });
        await item.update({ "data.uses.value" : Math.max(0, item.data.data.uses.value - dice) });
    }
}

if (args[0].tag === "DamageBonus" && lastArg.item.name === "Healing Light") {
    const effect = tactor.effects.find(e => e.data.label === "Healing Light Bonus Dice");
    if (!effect || !effect.data.flags.dice) return;
    await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
    return { damageRoll: `${effect.data.flags.dice}d6[healing]`, flavor: "Healing Light Bonus Dice" };
}