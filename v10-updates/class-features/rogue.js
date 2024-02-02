//elusive
try {
    if (args[0].tag === "OnUse" && args[0].macroPass === "isAttacked" && !args[0].actor.effects.find(e => ["Incapacitated", "Unconscious", "Paralyzed", "Petrified", "Stunned"].includes(e.label))) args[0].workflow.advantage = false;
} catch (err) {console.error("Elusive Macro - ", err)}

//sneak attack
try {
    if (args[0].macroPass != "postDamageRoll" || (!args[0].hitTargets.length && MidiQOL.configSettings().autoRollDamage == "always") || !args[0].damageRoll || !["mwak", "rwak"].includes(args[0].item.system.actionType) || args[0].disadvantage || (args[0].item.system.actionType == "mwak" && !args[0].item.system.properties?.fin) || (game.combat && args[0].actor.effects.find(e => e.name == "Used Sneak Attack" && !e.disabled)) || !(args[0].advantage || canvas.tokens.placeables.find(t => t.actor && MidiQOL.typeOrRace(t.actor) && t !== args[0].workflow.token && t !== args[0].targets[0] && t?.document?.disposition == args[0].workflow.token?.document?.disposition && !MidiQOL.checkIncapacitated(t.actor) && MidiQOL.computeDistance(t, args[0].targets[0], false) < 10))) return;
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
            duration: { turns: 1, seconds: 1 },
            name: "Used Sneak Attack",
            icon: "icons/weapons/daggers/dagger-simple-pink.webp",
            flags: { dae: { specialDuration: ["combatEnd"] } }
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    }
    const dice = args[0].actor.system.scale?.rogue?.["sneak-attack"];
    const diceMult = args[0].isCritical ? 2 : 1;
    let bonusRoll = await new Roll('0 + ' + `${dice * diceMult}d6`).evaluate({async: true});
    if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
    for (let i = 1; i < bonusRoll.terms.length; i++) {
        args[0].damageRoll.terms.push(bonusRoll.terms[i]);
    }
    args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${dice * diceMult}d6`;
    args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
    await args[0].workflow.setDamageRoll(args[0].damageRoll);
} catch (err) {console.error("Sneak Attack Macro - ", err)}