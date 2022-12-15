// healing light
// on use

(async () => {
    if(args[0].targets.length === 0) return ui.notifications.warn(`Please select a target.`);
    const target = canvas.tokens.get(args[0].targets[0].id);
    const itemD = args[0].item;
    const actorD = await game.actors.get(args[0].actor._id);
    const tokenD = await canvas.tokens.get(args[0].tokenId);
    const getData = await actorD.getRollData();
    const resourceList = [{ name: "primary" }, { name: "secondary" }, { name: "tertiary" }];
    const resourceValues = Object.values(actorD.data.data.resources);
    const resourceTable = mergeObject(resourceList, resourceValues);
    const abilityName = "Healing Light";
    const findResourceSlot = resourceTable.find(i => i.label.toLowerCase() === abilityName.toLowerCase());
    const maxSpend = Math.max(getData.abilities.cha.mod, 1);
    const finalMax = Math.min(maxSpend, findResourceSlot.max);
    const healingType = "healing";
    const minHeal = Math.clamped(findResourceSlot.value, 0, target.actor.data.data.attributes.hp.max - target.actor.data.data.attributes.hp.value);
    const content_heal = `<div style="vertical-align:top;display:flex;"><img src="${target.data.img}" style="border:none;" height="30" width="30"> <span style="margin-left:10px;line-height:2.1em;">${target.data.name} <b>HP:</b> ${target.actor.data.data.attributes.hp.value} / ${target.actor.data.data.attributes.hp.max}</span></div><hr><form class="flexcol"><div class="form-group"><label for="num"><b>[${findResourceSlot.value}/${findResourceSlot.max}]</b> Dice to spend:</span></label><input id="num" name="num" type="number" min="0" max="${findResourceSlot.max}" value="${minHeal}"></input></div></form>`;
    if(findResourceSlot.value === 0) return ui.notifications.warn(`You are out of the required resource`);
    new Dialog({
        title: itemD.name,
        content: content_heal,
        buttons: {
            heal: {
                icon: '<i class="fas fa-check"></i>', label: 'Heal', callback: async (html) => {
                    let number = Math.floor(Number(html.find('#num')[0].value));
                    if (number < 1 || number > finalMax) {
                        return ui.notifications.warn(`Invalid number of charges entered (${number})`);
                    } else {
                        let healDamage = new Roll(`${number}d6`).evaluate({ async: false });
                        if (game.dice3d) game.dice3d.showForRoll(healDamage);
                        new MidiQOL.DamageOnlyWorkflow(actorD, tokenD, healDamage.total, healingType, [target], healDamage, { flavor: `(${CONFIG.DND5E.healingTypes[healingType]})`, itemCardId: args[0].itemCardId, useOther: false });
                        let total = Number(findResourceSlot.value - number);
                        let actor_data = duplicate(actorD.data._source);
                        actor_data.data.resources[findResourceSlot.name].value = total;
                        await tokenD.actor.update(actor_data);
                    }
                }
            }
        },
        default: "heal"
    }).render(true);
})();