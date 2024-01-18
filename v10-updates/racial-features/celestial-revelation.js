try {
    if (args[0].macroPass != "postDamageRoll" || !args[0].hitTargets.length || !args[0].damageRoll || args[0].item.type != "weapon" || !["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType) || (game.combat && game.combat?.current?.tokenId != args[0].tokenId) || (game.combat && args[0].actor.effects.find(e => e.name == "Used Celestial Revelation" && !e.disabled))) return;
	let useFeat = true;
    if (game.combat) {
        let dialog = new Promise((resolve) => {
            new Dialog({
            title: "Celestial Revelation",
            content: `<p>Use Celestial Revelation to deal additional damage?</p>`,
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
            flags: { dae: { specialDuration: ["turnStart", "combatEnd"] } },
			icon: "icons/commodities/biological/wing-bird-white.webp",
            name: "Used Radiant Soul",
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    }
	let damage = args[0].actor.system.attributes.prof;
	let damageType = args[0].actor.flags["midi-qol"]?.celestialRevelation ? args[0].actor.flags["midi-qol"]?.celestialRevelation : "radiant";
	let bonusRoll = await new Roll('0 + ' + `${damage}[${damageType}]`).evaluate({async: true});
    if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
    for (let i = 1; i < bonusRoll.terms.length; i++) {
        args[0].damageRoll.terms.push(bonusRoll.terms[i]);
    }
    args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${damage}[${damageType}]`;
    args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
    await args[0].workflow.setDamageRoll(args[0].damageRoll);
	args[0].workflow.divineStrike = true;
} catch (err) {console.error("Celestial Revelation Macro - ", err)}