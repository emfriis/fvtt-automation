// redirect attack
// on use

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].workflowOptions.sourceItemUuid);
if (!["mwak","rwak","msak","rsak"].includes(attackWorkflow.item.data.data.actionType)) return;

const attacker = attackWorkflow.token;
if (!attacker) return;

let canSeeAttacker = true;
if (game.modules.get("conditional-visibility")?.active && game.modules.get("levels")?.active && _levels) { 
    canSeeAttacker = game.modules.get('conditional-visibility')?.api?.canSee(token, attacker) && _levels?.advancedLosTestVisibility(token, attacker);
} 
if (!canSeeAttacker) return;

let nearbyAllyGoblins = await canvas.tokens.placeables.filter(t => {
    let nearbyAlly = (
        t.actor && // exists
        t.document.uuid !== token.document.uuid && // not me
        t.document.uuid !== attacker.document.uuid && // not the attacker
        t.data.disposition === token.data.disposition && // an ally
        (t.actor.data.data.details?.type?.subtype?.toLowerCase().includes("goblin") || t.actor.data.data.details?.race?.toLowerCase().includes("goblin")) && // a goblin
        MidiQOL.getDistance(t, token, false) <= 5 // close to the token
    );
    return nearbyAlly;
});

if (nearbyAllyGoblins.length < 1) {
    ui.notifications.warn("No nearby Goblins found");
    return;
} else if (nearbyAllyGoblins.length === 1) {
    attackWorkflow?.targets.delete(token);
    attackWorkflow?.targets.add(nearbyAllyGoblins[0]);
    let hook = Hooks.on("midi-qol.preDamageRoll", workflow => {
        if (workflow.uuid === attackWorkflow.uuid) {
            workflow?.hitTargets.delete(token);
            Hooks.off("midi-qol.preDamageRoll", hook);
        };
    });
    const tokenCoords = { x: token.data.x, y: token.data.y };
    const newTargetCoords = { x: nearbyAllyGoblins[0].data.x, y: nearbyAllyGoblins[0].data.y };
    new Sequence().animation().on(token).moveTowards(newTargetCoords).animation().on(nearbyAllyGoblins[0]).moveTowards(tokenCoords).play();
    return;
}

let target_content = "";
nearbyAllyGoblins.forEach((t) => {
    target_content += `<label class="radio-label">
    <input type="radio" name="target" value="${t.id}">
    <img src="${t.data.img}" style="border:0px; width: 100px; height:100px;">
    </label>`;
});

let content = `
<style>
.target .form-group {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    align-items: flex-start;
    }

    .target .radio-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    justify-items: center;
    flex: 1 0 25%;
    line-height: normal;
    }

    .target .radio-label input {
    display: none;
    }

    .target img {
    border: 0px;
    width: 50px;
    height: 50px;
    flex: 0 0 50px;
    cursor: pointer;
    }

    /* CHECKED STYLES */
    .target [type=radio]:checked + img {
    outline: 2px solid #f00;
    }
</style>
<form class="target">
    <div class="form-group" id="target">
        ${target_content}
    </div>
</form>
`;

let dialog = new Promise(async (resolve, reject) => {
    new Dialog({
        title: "Redirect Attack: Choose a new target",
        content,
        buttons: {
            Choose: {
                label: "Choose",
                callback: async () => {
                    const selectedId = $("input[type='radio'][name='target']:checked").val();
                    const newTarget = canvas.tokens.get(selectedId);
                    attackWorkflow?.targets.delete(token);
                    attackWorkflow?.targets.add(newTarget);
                    let hook = Hooks.on("midi-qol.preDamageRoll", workflow => {
                        if (workflow.uuid === attackWorkflow.uuid) {
                            workflow?.hitTargets.delete(token);
                            Hooks.off("midi-qol.preDamageRoll", hook);
                        }
                    });
                    const tokenCoords = { x: token.data.x, y: token.data.y };
                    const newTargetCoords = { x: newTarget.data.x, y: newTarget.data.y };
                    new Sequence().animation().on(token).moveTowards(newTargetCoords).animation().on(newTarget).moveTowards(tokenCoords).play();
                    resolve(true);
                }
            },
            Cancel: {
                label: "Cancel",
                callback: async () => {resolve(false)}
            }
        },
        default: "Cancel"
    }).render(true);
});
await dialog;