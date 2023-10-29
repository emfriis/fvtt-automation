try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postDamageRoll" || !args[0].damageRoll || args[0].item.type != "weapon" || !["mwak", "rwak"].includes(args[0].item.system.actionType) || (game.combat && game.combat?.current?.tokenId != args[0].tokenId) || (game.combat && args[0].actor.effects.find(e => e.label === "Used Divine Strike" && disabled == false))) return;
	let useFeat = true;
    if (game.combat) {
        let dialog = new Promise((resolve) => {
            new Dialog({
            title: "Divine Strike",
            content: `<p>Use Divine Strike?</p>`,
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
            duration: { rounds: 1, seconds: 7 },
            flags: { dae: { specialDuration: ["turnStart"] } },
            label: "Used Divine Strike",
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    }
	let dice = args[0].actor?.classes?.cleric?.system?.levels > 13 ? 2 : 1;
    let diceMult = args[0].isCritical ? 2 : 1;
	let damageType = args[0].actor.flags["midi-qol"]?.divineStrike ?? "radiant";
	let bonusRoll = await new Roll('0 + ' + `${diceMult}d8[${damageType}]`).evaluate({async: true});
    if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
    for (let i = 1; i < bonusRoll.terms.length; i++) {
        args[0].damageRoll.terms.push(bonusRoll.terms[i]);
    }
    args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${dice * diceMult}d8[${damageType}]`;
    args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
    await args[0].workflow.setDamageRoll(args[0].damageRoll);
	args[0].workflow.divineStrike = true;
} catch (err) {console.error("Blessed Strike Macro - ", err)}