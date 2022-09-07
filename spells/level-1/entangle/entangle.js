const lastArg = args[args.length - 1];
  
async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

async function attemptRemoval(targetToken, condition, item) {
    if (game.dfreds.effectInterface.hasEffectApplied(condition, targetToken.uuid)) {
        new Dialog({
        title: `Use action to attempt to remove ${condition}?`,
        buttons: {
            one: {
            label: "Yes",
            callback: async () => {
                const caster = item.parent;
                const saveDc = caster.data.data.attributes.spelldc;
                const removalCheck = true;
                const ability = "str";
                const type = removalCheck ? "check" : "save";
                const flavor = `${condition} (via ${item.name}) : ${CONFIG.DND5E.abilities[ability]} ${type} vs DC${saveDc}`;
                const rollResult = removalCheck
                ? (await targetToken.actor.rollAbilityTest(ability, { flavor })).total
                : (await targetToken.actor.rollAbilitySave(ability, { flavor })).total;

                if (rollResult >= saveDc) {
                game.dfreds.effectInterface.removeEffect({ effectName: condition, uuid: targetToken.uuid });
                } else {
                if (rollResult < saveDc) ChatMessage.create({ content: `${targetToken.name} fails the ${type} for ${item.name}, still has the ${condition} condition.` });
                }
            },
            },
            two: {
            label: "No",
            callback: () => {},
            },
        },
        }).render(true);
    }
}

if (args[0] === "each") {
    const targetToken = await fromUuid(lastArg.tokenUuid);
    const condition = "Restrained";
    const item = await fromUuid(lastArg.efData.origin);
    attemptRemoval(targetToken, condition, item);
}