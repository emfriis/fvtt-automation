// phalanx formation

if (args[0].tag === "OnUse" && ["mwak","rwak","msak","rsak"].includes(args[0].itemData.data.actionType)) {
    const token = canvas.tokens.get(args[0].tokenId);
    let nearbyShield = canvas.tokens.placeables.find(t =>
        t.actor &&
        t.actor?.uuid !== args[0].actorUuid && // not me
        t.data.disposition === token.data.disposition && // an ally
        MidiQOL.getDistance(t, token, false) <= 5 && // close to the target
        t.actor.items.find(i => i.data.data?.armor?.type === "shield" && i.data.data?.equipped) && // shield equipped
        t.actor.data.data.attributes.hp.value > 0 && // not dead or unconscious
        !(t.actor?.effects.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.data.label))) // not incapacitated
    );
    if (nearbyShield) {
        const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
        attackWorkflow.advantage = true;
    } 
}