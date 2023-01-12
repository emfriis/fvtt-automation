// fury of the small
// damage bonus

try {
    if (!(["mwak","rwak","msak","rsak"].includes(args[0].itemData.data.actionType) || args[0].item.type === "spell") || !args[0].hitTargets.length) return;
    let token = canvas.tokens.get(args[0].tokenId);
    let actor = token.actor;
    if (!actor) return;
    
    if (game.combat) {
      const advTime = `${game.combat.id}-${game.combat.round + game.combat.turn /100}`;
      const lastTime = actor.getFlag("midi-qol", "furyOfTheSmallTime");
      if (advTime === lastTime) return;
    }
    
    let sizes = ["tiny","sm","med","lg","huge","grg"];
    if (sizes.indexOf(actor.data.data.traits.size) >= Math.min(...args[0].hitTargets.filter(t => t.actor).map(t => sizes.indexOf(t.actor.data.data.traits.size)), 9999)) return;
    
    let furyItem = actor.items.find(i => i.name === "Fury of the Small" && i.data.data.uses.value);
    if (!furyItem) return;
    
    let dialog = new Promise((resolve, reject) => {
        new Dialog({
            title: "Fury of the Small",
            content: "Use Fury of the Small to add your proficienct modifier to the damage roll?",
            buttons: {
                Ok: {
                    label: "Ok",
                    callback: () => {resolve(true)},
                },
                Cancel: {
                    label: "Cancel",
                    callback: () => {resolve(false)},
                },
            },
            default: "Cancel",
            close: () => {resolve(false)}
        }).render(true);
    });
    let useFury = await dialog;
    if (!useFury) return;
    
    const damageType = args[0].item.data.damage.parts[0][1];
    if (game.combat) {
      const furyTime = `${game.combat.id}-${game.combat.round + game.combat.turn /100}`;
      const lastTime = actor.getFlag("midi-qol", "furyOfTheSmallTime");
      if (furyTime !== lastTime) {
        await actor.setFlag("midi-qol", "furyOfTheSmallTime", furyTime)
      }
    }
    
    await furyItem.update({"data.uses.value": furyItem.data.data.uses.value - 1 });
    return {damageRoll: `${actor.data.data.attributes.prof}[${damageType}]`, flavor: "Fury of the Small"};
} catch (err) {
    console.error(`Fury of the Small error`, err);
}