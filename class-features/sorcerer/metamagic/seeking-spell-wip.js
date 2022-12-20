} else if (lastArg.macroPass === "preCheckHits" && ["msak","rsak"].includes(args[0].item.data.actionType) && usesItem.data.data.uses.value >= 2 && !args[0].advantage && !args[0].disadvantage) {

    if (!(tactor.items.find(i => i.name === "Metamagic: Seeking Spell"))) return;
    if (!args[0].isCritical && args[0].attackRoll.total >= args[0].targets.map(t => t.actor.data.data.attributes.ac.value).reduce((prv, val) => { return (prv > val ? prv : val) })) return;
    let seekingDialog =  new Promise(async (resolve, reject) => {
            new Dialog({
                title: "Metamagic: Seeking Spell",
                content: `<p>Use Seeking Spell to reroll the missed Attack Roll? (2 Sorcery Points)<br>(${usesItem.data.data.uses.value} Sorcery Points Remaining)</p>`,
                buttons: {
                    Ok: {
                        label: "Ok",
                        callback: () => {resolve(true)},
                    },
                },
                default: "Ok",
                close: () => { resolve(false) },
            }).render(true);
    });
    let seek = await seekingDialog;
    if (!seek) return;
    let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    let newRoll = new Roll(workflow.attackRoll.formula).evaluate({ async: false });
    if (game.dice3d) game.dice3d.showForRoll(newRoll);
    workflow.attackRoll.dice[0].total = newRoll.total;
    workflow.attackRoll.dice[0]._total = newRoll.total;
    workflow.attackRoll.total = newRoll.total;
    workflow.attackRoll._total = newRoll.total;
    workflow.attackRollHTML = await workflow.attackRoll.render();
    if (workflow.isFumble && newRoll.dice[0].total !== 1) workflow.isFumble = false;
    let noCritical = args[0].targets.find(t => t.actor.data.flags["midi-qol"]?.noCritical.all || t.actor.data.flags["midi-qol"]?.noCritical[args[0].item.data.actionType]);
    if (!noCritical && (newRoll.dice[0].total === 20 || newRoll.dice[0].total >= tactor.data.flags?.dnd5e?.spellCriticalThreshold || newRoll.dice[0].total >= args[0].targets.map(t => t.actor.data.flags["midi-qol"]?.grants?.critical?.range ?? 0).reduce((prv, val) => { return (prv > val ? prv : val) }))) workflow.isCritical = true;
    await usesItem.update({ "data.uses.value": usesItem.data.data.uses.value - 2 });

}