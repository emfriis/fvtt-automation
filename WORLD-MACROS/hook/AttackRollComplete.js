// AttackRollComplete

Hooks.on("midi-qol.AttackRollComplete", async (workflow) => {
    try {
        
        if (!["mwak","rwak","msak","rsak"].includes(workflow.item.data.data.actionType)) return;
    
        const targets = Array.from(workflow.hitTargets);
        for (let t = 0; t < targets.length; t++) {
            let token = targets[t];
            let tactor = token.actor;
            if (!tactor) continue;

            // thorns 
            // range(int[range]),damageDice(str[rollable]),damageType(str[damage]),magicEffect(str["magiceffect"] or null),spellEffect(str["magiceffect"] or null),saveDC(int[dc] or null),saveType(str[abil] or null),saveDamage(str["nodam","halfdam","fulldam"] or null)
            if (tactor.data.flags["midi-qol"].thorns) {
                try {
                    console.warn("Thorns activated");
                    const effects = tactor.effects.filter(e => e.data.changes.find(c => c.key === "flags.midi-qol.thorns"));
                    for (let e = 0; e < effects.length; e++) {
                        const thorns = effects[e].data.changes.find(c => c.key === "flags.midi-qol.thorns").value.split(",");
                        if (thorns[0] > 15 || ["mwak","msak"].includes(workflow.item.data.data.actionType))
                        if (MidiQOL.getDistance(token, workflow.token, false) <= parseInt(thorns[0])) {
                            const applyDamage = game.macros.find(m => m.name === "ApplyDamage");
                            if (applyDamage) await applyDamage.execute("ApplyDamage", token.id, workflow.tokenId, thorns[1], thorns[2], thorns[3], thorns[4], thorns[5], thorns[6]);
                        }
                    }
                } catch (err) {
                    console.error("Thorns error", err);
                }
            }

            // fey gift spite
            if (workflow.actor.data.flags["midi-qol"].feyGiftSpite) {
                try {
                    console.warn("Fey Gift: Spite activated");
                    const effectData = {
                        changes: [{ key: `flags.midi-qol.disadvantage.attack.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 }],
                        flags: { "dae": { specialDuration: ["1Attack"] } },
                        duration: { seconds: 60, startTime: game.time.worldTime },
                        disabled: false,
                        label: "Fey Gift: Spite Disadvantage",
                        icon: "systems/dnd5e/icons/skills/yellow_28.jpg"
                    };
                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
                    const effects = workflow.actor.effects.filter(e => e.data.label === "Fey Gift: Spite").map(e => e.id);
                    if (effects) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: workflow.actor.uuid, effects: effects });
                    console.warn("Fey Gift: Spite used");
                } catch (err) {
                    console.error("Fey Gift: Spite error", err);
                }
            }
        }
    } catch(err) {
        console.error(`AttackRollComplete error`, err);
    }
});