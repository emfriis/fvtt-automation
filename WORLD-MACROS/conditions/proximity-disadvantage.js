// proximity world macro

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

Hooks.on("midi-qol.preAttackRoll", async (workflow) => {
    try {
        if (!workflow?.token || !["rwak","rsak"].includes(workflow.item.data.data.actionType)) return;
        let negateConditions = ["Dead", "Defeated", "Incapacitated", "Stunned", "Unconcious"];
        let nearbyEnemy = canvas.tokens.placeables.filter(t => {
            let nearby = (
                t?.actor &&
                t.actor?.uuid !== workflow.actor?.uuid && // not me
                t?.document?.uuid !== workflow.token?.document?.uuid && // not the target
                !t.actor.effects.find(i => negateConditions.some(j => i.data.label.includes(j))) && // doesnt have negating condition
                t.data.disposition !== workflow.token.data.disposition && // not an ally
                t.data.disposition !== 0 && // not neutral
                MidiQOL.getDistance(t, workflow.token, false) <= 5 // close to the target
            )
            return nearby;
        });
        if (nearbyEnemy.length > 0) {
            workflow.disadvantage = true;
            console.warn("proximity disadvantage applied");
        }
    } catch(err) {
        console.error(`proximity disadvantage macro error`, err);
    }
});