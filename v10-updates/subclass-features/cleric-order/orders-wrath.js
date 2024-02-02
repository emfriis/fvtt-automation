try {
    if (args[0].macroPass == "postActiveEffects" && (args[0].hitTargets.length || MidiQOL.configSettings().autoRollDamage != "always") && args[0].damageRoll && args[0].targets.length && args[0].item.type == "weapon" && ["mwak", "rwak"].includes(args[0].item.system.actionType) && (args[0].workflow.divineStrike || args[0].workflow.blessedStrikes)) {
        const effectData = {
            disabled: false,
            duration: { rounds: 1, seconds: 7 },
            changes: [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "Compendium.dnd-5e-core-compendium.macros.boLeL2Q4CZvRZ69a, isAttacked", priority: "20" }],
            flags: { dae: { specialDuration: ["turnStartSource"] } },
            name: "Order's Wrath Damage Bonus",
            icon: "icons/magic/light/beam-deflect-path-yellow.webp"
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
    } else if (args[0].macroPass == "isAttacked" && args[0].hitTargets.length && ["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType)) {
        args[0].workflow.ordersWrath = true
        let hook1 = Hooks.on("midi-qol.preDamageRollComplete", async workflowNext => {
            if (workflowNext.uuid === args[0].uuid && args[0].workflow.ordersWrath && workflowNext.damageRoll && workflowNext.targets.size) {
                let newDamageRoll = workflowNext.damageRoll;
                let diceMult = workflowNext.isCritical ? 2 : 1;
                let bonusRoll = await new Roll('0 + ' + `${2 * diceMult}d8[psychic]`).evaluate({async: true});
                if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
                for (let i = 1; i < bonusRoll.terms.length; i++) {
                    newDamageRoll.terms.push(bonusRoll.terms[i]);
                }
                newDamageRoll._formula = newDamageRoll._formula + ' + ' + `${2 * diceMult}d8[psychic]`;
                newDamageRoll._total = newDamageRoll.total + bonusRoll.total;
                await workflowNext.setDamageRoll(newDamageRoll);
                let effect = [...workflowNext.targets][0].actor.effects.find(e => e.name == "Order's Wrath Damage Bonus");
                if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: [...workflowNext.targets][0].actor.uuid, effects: [effect.id] });
                Hooks.off("midi-qol.preDamageRollComplete", hook1);

            }
        });
        let hook2 = Hooks.on("midi-qol.preItemRoll", async workflowNext => {
            if (workflowNext.uuid === args[0].uuid) {
                Hooks.off("midi-qol.preDamageRollComplete", hook1);
                Hooks.off("midi-qol.preItemRoll", hook2);
            }
        });
    }
} catch (err) {console.error("Order's Wrath Macro - ", err)}