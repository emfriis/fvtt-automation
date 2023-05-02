try {
    const lastArg = args[args.length - 1];
    const target = canvas.tokens.get(lastArg.tokenId);
    const item = await fromUuid(lastArg.efData.origin);
    const attacker = item.parent;
    if (!target.actor || target.actor.system.traits.ci.value.has("poisoned") || target.actor.effects.find(e => e.data.label === `${attacker.name} Stench Immunity`)) return; // abort if target is immune
    if (args[0] === "each" && !lastArg.efData.disabled) {
        const saveItemData = {
            name: `${item.name} Save`,
            img: item.img,
            type: "feat",
            flags: {
                midiProperties: { magiceffect: item.flags["midi-qol"].magiceffect, spelleffect: item.flags["midi-qol"].spelleffect, }
            },
            system: {
                activation: { type: "none", },
                target: { type: "self", },
                actionType: item.system.save.type,
                save: { dc: item.system.save.dc, ability: item.system.save.ability, scaling: "flat" },
            }
        }
        let saveItem = new CONFIG.Item.documentClass(saveItemData, { parent: target.actor });
        let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
        if (saveWorkflow.failedSaves.size) {
            let effectData = {
                label: "Poisoned",
                icon: "icons/svg/poison.svg",
                origin: item.uuid,
                disabled: false,
                flags: { core: { statusId: "Poisoned" }, dae: { specialDuration: ["turnStart"] } },
                changes: [
                    { key: `flags.midi-qol.disadvantage.attack.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 },
                    { key: `flags.midi-qol.disadvantage.ability.check.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 }
                ],
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });
        } else {
            let effectData = {
                label: `${attacker.name} Stench Immunity`,
                origin: item.uuid,
                disabled: false,
                flags: { dae: { specialDuration: ["longRest"] } },
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });
        }
    }
} catch (err) {
    console.error(`Stench error`, err);
}