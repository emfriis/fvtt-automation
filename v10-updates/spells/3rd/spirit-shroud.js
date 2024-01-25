try {
    if (args[0].macroPass == "postActiveEffects" && args[0].item.name == "Spirit Shroud") {
        const options = args[0].workflow.newDefaultDamageType ? [args[0].workflow.newDefaultDamageType, "Radiant", "Necrotic", "Cold"] : ["Radiant", "Necrotic", "Cold"];
        const optionContent = options.map((o) => { return `<option value="${o}">${o}</option>` });
        let dialog = new Promise((resolve,) => {
            new Dialog({
                title: "Spirit Shroud: Choose a Damage Type",
                content: `<div><label>Damage Types: </label><select name="types"}>${optionContent}</select></div>`,
                buttons: {
                    Confirm: {
                        label: "Confirm",
                        callback: () => {resolve($("[name=types]")[0].value)},
                    },
                    Cancel: {
                        label: "Cancel",
                        callback: () => {resolve(false)},
                    },
                },
                default: "Cancel",
                close: () => {resolve(false)}
            }).render(true);
        });
        let type = await dialog;
        if (!type) return;
        const effectData = {
			changes: [{ key: "flags.midi-qol.spiritShroudDice", mode: 5, value: args[0].spellLevel - 2, priority: 20 }, { key: "flags.midi-qol.spiritShroudType", mode: 5, value: type, priority: 20 }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.E4mQxKgcFyzxCaNW, postDamageRoll", priority: 20 }, { key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.E4mQxKgcFyzxCaNW, postActiveEffects", priority: 20 }],
			disabled: false,
			origin: args[0].item.uuid,
			name: "Spirit Shroud Damage Bonus",
			icon: "icons/magic/death/skull-energy-light-white.webp",
			duration: { seconds: 60 }
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
    } else if (args[0].macroPass == "postDamageRoll" && args[0].hitTargets.length && args[0].damageRoll && ["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType) && MidiQOL.computeDistance(workflow.token, args[0].hitTargets[0]) <= 10) {
        let diceNum = +args[0].actor.flags["midi-qol"]?.spiritShroudDice ?? 1;
        let diceMult = args[0].isCritical ? 2 : 1;
        let damageType = args[0].actor.flags["midi-qol"]?.spiritShroudType ?? "radiant";
        let bonusRoll = await new Roll('0 + ' + `${diceNum * diceMult}d8[${damageType}]`).evaluate({async: true});
        if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
        for (let i = 1; i < bonusRoll.terms.length; i++) {
            args[0].damageRoll.terms.push(bonusRoll.terms[i]);
        }
        args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${diceNum * diceMult}d8[${damageType}]`;
        args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
        await args[0].workflow.setDamageRoll(args[0].damageRoll);
        console.error(args[0].workflow.damageRoll)
        args[0].workflow.spiritShroud = true;
    } else if (args[0].macroPass == "postActiveEffects" && args[0].hitTargets.length && args[0].damageRoll && ["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType) && MidiQOL.computeDistance(workflow.token, args[0].hitTargets[0]) <= 10) {
        const effectData = {
			changes: [{ key: "system.traits.di.value", mode: 0, value: "healing", priority: 20 }],
			disabled: false,
			origin: args[0].item.uuid,
			name: "Spirit Shroud Healing Negation",
			icon: "icons/magic/death/skull-energy-light-white.webp",
			duration: { rounds: 1, turns: 1, seconds: 7 },
			flags: { dae: { specialDuration: ["turnEndSource", "combatEnd"], stackable: "noneName" } }
		}
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
        const conc = args[0].actor.effects.find(e => e.name == "Concentrating");
        const effect = args[0].targets[0].actor.effects.find(e => e.name == "Spirit Shroud Healing Negation");
        if (conc && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: args[0].actor.uuid, updates: [{ _id: conc.id, changes: conc.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: effect.uuid, priority: 20 }]) }] });
    }
} catch (err) {console.error("Spirit Shroud Macro - ", err)}