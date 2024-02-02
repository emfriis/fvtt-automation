try {
    if (args[0].macroPass != "postDamageRoll" || (!args[0].hitTargets.length && MidiQOL.configSettings().autoRollDamage == "always") || !args[0].damageRoll || !["msak", "rsak", "save", "other"].includes(args[0].item.system.actionType)) return;
    let isCantrip = args[0].item.type == "spell" && args[0].spellLevel == 0;
    let isWeapon = args[0].item.type == "weapon" && ["mwak", "rwak"].includes(args[0].item.system.actionType);
    if (!isCantrip && !isWeapon) return;
    if (game.combat && args[0].actor.effects.find(e => e.name == "Used Blessed Strikes" && !e.disabled)) return;
    let useFeat = true;
    if (game.combat) {
        let dialog = new Promise((resolve) => {
            new Dialog({
            title: "Blessed Strikes",
            content: `<p>Use Blessed Strikes?</p>`,
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
			icon: "icons/magic/light/swords-light-glowing-white.webp",
            name: "Used Blessed Strikes"
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    }
    if (game.combat && isCantrip && !isWeapon && args[0].item.system.actionType == "save" && !args[0].actor.flags["midi-qol"].potentCantrip) {
        let hook1 = Hooks.on("midi-qol.postCheckSaves", async workflowNext => {
            if (workflowNext.uuid == args[0].uuid && args[0].workflow.blessedStrikes) {
                if (workflowNext.failedSaves.size == 0) {
                    await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [args[0].actor.effects.find(e => e.name == "Used Blessed Strikes").id] });
					args[0].workflow.blessedStrikes = false;
                    Hooks.off("midi-qol.postCheckSaves", hook1);
                    Hooks.off("midi-qol.preItemRoll", hook2);
                }
            }
        });
        let hook2 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
            if (workflowNext.uuid == args[0].uuid) {
                Hooks.off("midi-qol.postCheckSaves", hook1);
                Hooks.off("midi-qol.preItemRoll", hook2);
            }
        });
    }
    let diceMult = args[0].isCritical ? 2 : 1;
	let bonusRoll = await new Roll('0 + ' + `${diceMult}d8[radiant]`).evaluate({async: true});
    if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
    for (let i = 1; i < bonusRoll.terms.length; i++) {
        args[0].damageRoll.terms.push(bonusRoll.terms[i]);
    }
    args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${diceMult}d8[radiant]`;
    args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
    await args[0].workflow.setDamageRoll(args[0].damageRoll);
	args[0].workflow.blessedStrikes = true;
} catch (err) {console.error("Blessed Strikes Macro - ", err)}