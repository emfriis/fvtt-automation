try {
    if (args[0].macroPass == "postActiveEffects" && args[0].item.type == "spell" && args[0].item.name == "Zephyr Strike") {
        const effectData = { 
            changes: [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.ZYmlnwTTIZRv9ETB, preAttackRoll", priority: 20 }], 
            disabled: false, 
            icon: "icons/magic/fire/dagger-rune-enchant-flame-green.webp", 
            name: "Zephyr Strike", 
            duration: { seconds: 60 }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        const effect = args[0].actor.effects.find(e => e.name == "Zephyr Strike");
        if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
    } else if (args[0].macroPass == "preAttackRoll" && ["mwak", "rwak"].includes(args[0].item.system.actionType)) {
        let dialog = new Promise((resolve) => {
			new Dialog({
			title: "Usage Configuration: Zephyr Strike",
			content: `<p>Use Zephyr Strike to grant advantage and add 1d8 Force damage to this attack?</p>`,
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
		let useSpell = await dialog;
		if (!useSpell) return;
        args[0].workflow.advantage = true;
        args[0].workflow.zephyrStrike = true;
        const effect = args[0].actor.effects.find(e => e.name.includes("Zephyr Strike"));
        if (effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: effect.parent.uuid, updates: [{ _id: effect._id, changes: [] }] });                 
        let hook1 = Hooks.on("midi-qol.preDamageRollComplete", async (workflowNext) => {
            if (workflowNext.item.uuid == args[0].item.uuid && workflowNext.zephyrStrike) {
                let diceMult = args[0].isCritical ? 2: 1;
                let bonusRoll = await new Roll('0 + ' + `${diceMult}d8[force]`).evaluate({async: true});
                if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
                for (let i = 1; i < bonusRoll.terms.length; i++) {
                    workflowNext.damageRoll.terms.push(bonusRoll.terms[i]);
                }
                workflowNext.damageRoll._formula = workflowNext.damageRoll._formula + ' + ' + `${diceMult}d8[force]`;
                workflowNext.damageRoll._total = workflowNext.damageRoll.total + bonusRoll.total;
                await workflowNext.setDamageRoll(workflowNext.damageRoll);
            }
        });
        let hook2 = Hooks.on("midi-qol.preTargeting", async (workflowNext) => {
            if (workflowNext.item.uuid == args[0].item.uuid && !workflowNext.zephyrStrike) {
                Hooks.off("midi-qol.preDamageRollComplete", hook1);
                Hooks.off("midi-qol.preTargeting", hook2);
            }
        });
        const effectData = { 
            changes: [{ key: "system.attributes.movement.walk", mode: 2, value: "+30", priority: 20 }], 
            disabled: false, 
            icon: "icons/magic/fire/dagger-rune-enchant-flame-green.webp", 
            name: "Zephyr Strike Movement Bonus", 
            duration: { seconds: 1 },
            flags: { dae: { specialDuration: ["endCombat", "endTurn"] } }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    } 
} catch (err) {console.error("Zephyr Strike Macro - ", err)}