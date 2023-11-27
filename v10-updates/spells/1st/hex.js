try {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    //create effects and reapply item
    if (lastArg.tag == "OnUse" && lastArg.macroPass == "postActiveEffects") {
        const item = actor.items.find(i => i.name == "Hex" && i.type == "spell");
        const effect = actor.effects.find(e => e.name == "Hex Damage Bonus");
        const isReapply = lastArg.item.name != "Hex";
        const conc = actor.effects.find(e => e.name == "Concentrating");
        const target = lastArg.targets[0]?.actor;
        if(!target) return;
        if (isReapply) {
            const prevTarget = canvas.tokens.get(actor.flags["midi-qol"]?.hexTarget);
            if (prevTarget && prevTarget.actor.system.attributes.hp.value > 0) {
                return ui.notifications.warn("Previous target still above 0 hit points");
            } else if (prevTarget && prevTarget.actor.system.attributes.hp.value < 1) {
                await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: prevTarget.actor.uuid, effects: [prevTarget.actor.effects.find(e => e.name == "Hex" && e.origin == item.uuid)?.id] });
            }
        } else {
            const duration = lastArg.spellLevel > 4 ? 86400 : lastArg.spellLevel > 2 ? 28800 : 3600;
            const damageType = lastArg.workflow.defaultDamageType ? lastArg.workflow.defaultDamageType.toLowerCase() : "necrotic";
            if (effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: effect.id, duration: { seconds: duration }, changes: effect.changes.concat([{ key: `flags.midi-qol.hexDamageType`, mode: 5, value: damageType, priority: 20 }]) }] });
            if (conc) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: conc.id, duration: { seconds: duration } }] });
            const itemData = mergeObject(duplicate(item), {
                name: "Reapply Hex",
                type: "feat",
                effects: [],
                system: { duration: { value: null, units: null}, components: {concentration: false, material: false, ritual: false, somatic: false, value: "", vocal: false} }
            }, {overwrite: true, inlace: true, insertKeys: true, insertValues: true});
            await actor.createEmbeddedDocuments("Item", [itemData]);
            const reapplyItem = actor.items.find(i => i.name == "Reapply Hex");
            if (reapplyItem && effect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: effect.id, changes: effect.changes.concat([{ key: `flags.dae.deleteUuid`, mode: 5, value: reapplyItem.uuid, priority: 20 }]) }] });
        }
        //choose hex ability
        let ability;
        let dialog = new Promise((resolve) => {
            new Dialog({
                title: `Hex: Usage Configuration`,
                content: `
                    <p>Choose a type of ability check to give the target disadvantage on:</p>
                    <div class="form-group">
                        <select name="abilities"}>
                            <option value="str">Strength</option>
                            <option value="dex">Dexterity</option>
                            <option value="con">Consitution</option>
                            <option value="int">Intelligence</option>
                            <option value="wis">Wisdom</option>
                            <option value="cha">Charisma</option>
                        </select>
                    </div>
                `,
                buttons: {
                    Confirm: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirm",
                        callback: () => resolve($("[name=abilities]")[0].value)
                    },
                    Cancel: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => {resolve(false)}
                    }
                },
                default: "Cancel",
                close: () => {resolve(false)}
            }).render(true);
        });
        ability = await dialog;
        if (!ability) return;
        //create target effect
        const effectData = {
            name: item.name,
            icon: item.img,
            changes: [
                { key: `flags.midi-qol.disadvantage.ability.check.${ability}`, mode: 0, value: 1, priority: 20 },
                { key: "flags.midi-qol.hex", mode: 2, value: lastArg.actor.uuid, priority: 20 }
            ],
            origin: item.uuid,
            disabled: false,
            flags: { dae: { showIcon: true } },
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.uuid, effects: [effectData] });
        //update self effect
        const targetEffect =  target.effects.find(e => e.name == "Hex" && e.changes.find(c => c.key == "flags.midi-qol.hex" && c.value == lastArg.actor.uuid));
        if (effect && targetEffect) await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: actor.uuid, updates: [{ _id: effect.id, changes: effect.changes.filter(c => c.key != "flags.midi-qol.hexTarget").concat([{ key: "flags.midi-qol.hexTarget", mode: 2, value: lastArg.targets[0].id, priority: 20 }, { key: `flags.dae.deleteUuid`, mode: 5, value: targetEffect.uuid, priority: 20 }]) }] });
    }
    //apply damage bonus
    if (lastArg.tag == "OnUse" && lastArg.macroPass == "postDamageRoll" && lastArg.damageRoll && ["mwak","rwak","msak","rsak"].includes(lastArg.item.system.actionType) && lastArg.targets.find(t => t.actor.flags["midi-qol"]?.hex?.includes(lastArg.actor.uuid))) {
        const diceMult = lastArg.isCritical ? 2 : 1;
        const damageType = actor.flags["midi-qol"]?.hexDamageType ? actor.flags["midi-qol"]?.hexDamageType : "necrotic";
        let bonusRoll = await new Roll('0 + ' + `${diceMult}d6[${damageType}]`).evaluate({async: true});
        for (let i = 1; i < bonusRoll.terms.length; i++) {
            args[0].damageRoll.terms.push(bonusRoll.terms[i]);
        }
        args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${diceMult}d6[${damageType}]`;
        if (game.dice3d) game.dice3d.showForRoll(bonusRoll);
        args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
        await args[0].workflow.setDamageRoll(args[0].damageRoll);
    }
    //remove reapply item
    if (args[0] == "off" && lastArg.efData.name == "Hex Damage Bonus") {
        const removeItem = actor.items.find(i => i.name == "Reapply Hex");
        if (removeItem) await actor.deleteEmbeddedDocuments("Item", [removeItem.id]);
    }
} catch (err) {console.error("Hex Macro - ", err)}