// eldritch smite
// damage bonus

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "DamageBonus" && lastArg.item.name.includes("Pact") && ["mwak","rwak"].includes(lastArg.item.data.actionType)) {
    try {
        if (args[0].hitTargets.length < 1) return;
        token = canvas.tokens.get(args[0].tokenId);
        actor = token.actor;
        if (!actor) return;
        let target = canvas.tokens.get(args[0].hitTargets[0].id ?? args[0].hitTargets[0]._id);
        let targetActor = args[0].hitTargets[0].actor;
        if (!targetActor) MidiQOL.error("No target for Eldritch Smite found");
        let targetSize = targetActor.data.data.traits.size;
    
        let pactSlots = actor.data.data.spells.pact;
        let slotLevel = pactSlots.level;
        
        if (pactSlots.value > 0) {

            let dialog = new Promise((resolve, reject) => {
                new Dialog({
                title: "Eldritch Smite: Usage Configuration",
                content: `
                <form id="smite-use-form">
                    <p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Eldritch Smite", type: "feature"}) + `</p>
                    <p>Consume a Pact Slot to use Eldritch Smite?</p>
                    <p>(` + pactSlots.value + ` Pact Slots Remaining)</p>
                    <div class="form-group">
                        <label class="checkbox">
                        <input id="consume" type="checkbox" name="consumeCheckbox" checked/>` + game.i18n.localize("DND5E.SpellCastConsume") + `</label>
                    </div>
                    <div class="form-group">
                        <label class="checkbox">
                        <input id="prone" type="checkbox" name="proneCheckbox" checked/>` + "Knock Target Prone?" + `</label>
                    </div>
                </form>
                `,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Smite",
                        callback: () => resolve([$('#prone').is(":checked"), $('#consume').is(":checked")])
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => {resolve(false)}
                    }
                },
                default: "two",
                close: callBack => {resolve(false)}
                }).render(true);
            });
            smite = await dialog;
            
            if (!smite) return {};
            
            let prone = smite[0];
            let consumeSlot = smite[1];
            let canProne = (targetSize != "grg") ? true : false;
            
            pactSlots = actor.data.data.spells.pact;
            if (pactSlots < 1 && consumeSlot) {
                ui.notifications.warn("Eldritch Smite: No Pact Slots Remaining");
                return {};
            }
            
            if (prone && !targetActor.effects.find(e => e.data.label === "Prone")) {
                if (canProne) {
                    let effectData = {
                        origin: args[0].uuid,
                        disabled: false,
                        changes: [{ key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Prone", priority: 20 }]
                    };
                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });
                } else {
                    ui.notifications.warn("Eldritch Smite: Target too Large to be Knocked Prone");
                }
            }
            
            if (consumeSlot) {
                let objUpdate = new Object();
                objUpdate['data.spells.pact.value'] = pactSlots.value - 1;
                actor.update(objUpdate);
            }
            
            let diceMult = args[0].isCritical ? 2: 1;
            let numDice = 1 + slotLevel;
            
            return {damageRoll: `${numDice * diceMult}d8[force]`, flavor: "Eldritch Smite"};
            
        }	
    } catch (err) {
        console.error ("Eldritch Smite macro error", err);
    }
}