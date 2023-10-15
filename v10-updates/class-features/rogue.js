//elusive
try {
    if (args[0].tag === "OnUse" && args[0].macroPass === "isAttacked" && !args[0].actor.effects.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.label))) args[0].workflow.advantage = false;
} catch (err) {console.error("Elusive Macro - ", err)}

//sneak attack
try {
    if (args[0].tag !== "DamageBonus" || !args[0].damageRoll || !["mwak", "rwak"].includes(args[0].item.system.actionType) || args[0].disadvantage || (args[0].item.system.actionType === "mwak" && !args[0].item.system.properties?.fin) || (game.combat && args[0].actor.effects.find(e => e.label === "Used Sneak Attack")) || !(args[0].advantage || canvas.tokens.placeables.find(t=> t.actor && !((t.actor.system.details?.type?.value === "custom" || t.actor.system.details?.type?.value === "") && t.actor.system.details?.type?.custom === "") && t.id !== args[0].workflow.token.id && t.id !== args[0].targets[0].id && t.disposition === args[0].workflow.token.disposition && t.actor.system.attributes?.hp.value > 0 && !t.actor.effects.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.label)) && MidiQOL.getDistance(t, args[0].targets[0], false) < 10))) return;
    let useFeat = true;
    if (game.combat) {
        let dialog = new Promise((resolve) => {
            new Dialog({
            title: "Sneak Attack",
            content: `<p>Use Sneak Attack?</p>`,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: () => resolve(true)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => {resolve(false)}
                }
            },
            default: "cancel",
            close: () => {resolve(false)}
            }).render(true);
        });
        useFeat = await dialog;
    }
    if (!useFeat) return;
    if (game.combat) {
        const effectData = {
            disabled: false,
            duration: { turns: 1 },
            label: "Used Sneak Attack",
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    }
    const dice = args[0].actor.system.scale?.rogue?.["sneak-attack"] ?? 1;
    const diceMult = args[0].isCritical ? 2 : 1;
    return { damageRoll: `${dice * diceMult}d6`, flavor: "Sneak Attack" };
} catch (err) {console.error("Sneak Attack Macro - ", err)}