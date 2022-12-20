// piercer
// effect on use pre damage
// effect on use post damage

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && args[0].macroPass === "preDamageRoll") {
    if (!["mwak","rwak","msak","rsak"].includes(args[0].item.data.actionType) || args[0].itemData.data?.damage?.parts[0][1] !== "piercing" || !args[0]?.isCritical) return;
    let effectData = [{
        changes: [
            { key: `flags.dnd5e.meleeCriticalDamageDice`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 1, priority: 20 },
            { key: `flags.dnd5e.rangedCriticalDamageDice`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: 1, priority: 20 },
        ],
        origin: args[0].uuid,
        flags: {
            "dae": { specialDuration: ["1Attack"] },
        },
        disabled: false,
        label: "Piercer Damage Bonus"
    }];
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
}

if (args[0].tag === "OnUse" && args[0].macroPass === "postDamageRoll") {
    if (!["mwak","rwak","msak","rsak"].includes(args[0].item.data.actionType) || args[0].itemData.data?.damage?.parts[0][1] !== "piercing" || args[0].hitTargets.length < 1) return;
    if (game.combat) {
        const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`;
        const lastTime = tactor.getFlag("midi-qol", "piercerTime");
        if (combatTime === lastTime) {
            return;
        }
    }
    await wait(100);
    let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid); 
    let diceResults = workflow.damageRoll.dice[0].results;
    let die_content = "";
    for (let i = 0; i < diceResults.length; i++) {
        if (diceResults[i]?.rerolled) continue;
        die_content += `<label class="radio-label">
        <input type="radio" name="die" value="${diceResults[i].result}">
        <img src="icons/svg/d${workflow.damageRoll.dice[0].faces}-grey.svg" style="border:0px; width: 50px; height:50px;">
        ${diceResults[i].result}
        </label>`;
    };

    let content = `
        <style>
        .dice .form-group {
            display: flex;
            flex-wrap: wrap;
            width: 100%;
            align-items: flex-start;
        }

        .dice .radio-label {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            justify-items: center;
            flex: 1 0 25%;
            line-height: normal;
        }

        .dice .radio-label input {
            display: none;
        }

        .dice img {
            border: 0px;
            width: 50px;
            height: 50px;
            flex: 0 0 50px;
            cursor: pointer;
        }

        /* CHECKED STYLES */
        .dice [type=radio]:checked + img {
            outline: 2px solid #f00;
        }
        </style>
        <form class="dice">
        <div class="form-group" id="dice-group">
            ${die_content}
        </div>
        </form>
    `;

    let useReroll = await new Promise((resolve, reject) => {
        new Dialog({
            title: "Piercer: Choose a damage die to reroll",
            content,
            buttons: {
                Ok: {
                    label: "Ok",
                    callback: async () => {resolve($("input[type='radio'][name='die']:checked").val())},
                },
                Cancel: {
                    label: "Cancel",
                    callback: async () => {resolve(false)},
                },
            },
            default: "Cancel",
            close: () => {resolve(false)}
        }).render(true);
    });

    if (!useReroll) return;

    let newRoll = new Roll(`1d${workflow.damageRoll.dice[0].faces}`).evaluate({ async: false });
	if (game.dice3d) game.dice3d.showForRoll(newRoll);

    let replaceRoll = workflow.damageRoll.dice[0].results.find(i => i.result == parseInt(useReroll));
    if (replaceRoll) {
        replaceRoll.rerolled = true;
        replaceRoll.active = false;
        workflow.damageRoll.dice[0].results.push({ result: parseInt(newRoll.result), active: true });
        let newSubTotal = parseInt(workflow.damageRoll.dice[0].total) + parseInt(newRoll.total) - parseInt(replaceRoll.result);
        workflow.damageRoll.dice[0].total = newSubTotal;
        workflow.damageRoll.dice[0]._total = newSubTotal;
        workflow.damageRoll.dice[0].result = newSubTotal;
        let newTotal = parseInt(workflow.damageRoll.total) + parseInt(newRoll.total) - parseInt(replaceRoll.result);
        workflow.damageRoll.total = newTotal;
        workflow.damageRoll._total = newTotal;
        workflow.damageRoll.result = newTotal;
        workflow.damageRollHTML = await workflow.damageRoll.render();
    }

    if (game.combat) {
        const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`;
        const lastTime = tactor.getFlag("midi-qol", "piercerTime");
        if (combatTime !== lastTime) {
           await tactor.setFlag("midi-qol", "piercerTime", combatTime)
        }
    }
}