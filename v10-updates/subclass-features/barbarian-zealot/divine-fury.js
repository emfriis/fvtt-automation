try {
    if (args[0].macroPass != "postDamageRoll" || (!args[0].hitTargets.length && MidiQOL.configSettings().autoRollDamage == "always") || !args[0].damageRoll || args[0].item.type != "weapon" || !["mwak", "rwak"].includes(args[0].item.system.actionType) || (game.combat && game.combat?.current?.tokenId != args[0].tokenId) || (game.combat && args[0].actor.effects.find(e => e.name == "Used Divine Fury" && !e.disabled))) return;
	const level = args[0].actor.classes?.barbarian?.system?.levels;
	const damageType = args[0].actor.flags["midi-qol"]?.divineFury?.trim();
	const rage = args[0].actor.effects.find(e => e.name == "Rage");
	if (!level || !damageType || !rage) return;
	let useFeat = true;
    if (game.combat) {
        let dialog = new Promise((resolve) => {
            new Dialog({
            title: "",
            content: `<p>Use Divine Fury?</p>`,
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
			icon: "icons/weapons/clubs/club-bone-blue.webp",
            name: "Used Divine Fury",
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    }
	const diceMult = args[0].isCritical ? 2 : 1;
	let bonusRoll = await new Roll('0 + ' + `${diceMult}d6[${damageType}] + ${level}[${damageType}]`).evaluate({async: true});
    for (let i = 1; i < bonusRoll.terms.length; i++) {
        args[0].damageRoll.terms.push(bonusRoll.terms[i]);
    }
    args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${diceMult}d6[${damageType}] + ${level}[${damageType}]`;
    args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
    await args[0].workflow.setDamageRoll(args[0].damageRoll);
} catch (err) {console.error("Divine Fury Macro - ", err)}