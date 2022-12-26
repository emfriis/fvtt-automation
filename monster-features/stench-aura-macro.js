// stench

const lastArg = args[args.length - 1];
const item = await fromUuid(lastArg.efData.origin);
const caster = item.parent;
const target = await fromUuid(lastArg.actorUuid);
const tactor = target.actor ? target.actor : target;
if (getProperty(tactor.data.flags, "midi-qol.stenchImmunity")?.includes(caster.name) || tactor.data.data.traits.ci.value.includes("poisoned")) return;

if (args[0] === "each") {
    const itemData = {
        name: `Stench Poisoned Save`,
        img: `icons/commodities/tech/smoke-bomb-purple.webp`,
        type: "feat",
        data: {
            activation: { type: "none", },
            target: { type: "self", },
            actionType: "save",
            save: { dc: 10, ability: "con", scaling: "flat" },
        }
    }
    await USF.socket.executeAsGM("createItem", { actorUuid: tactor.uuid, itemData: itemData });
    let saveItem = await tactor.items.find(i => i.name === itemData.name);
    let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
    await USF.socket.executeAsGM("deleteItem", { itemUuid: saveItem.uuid });

    if (saveWorkflow.failedSaves.size) {
        let effectData = {
            label: "Poisoned",
            origin: lastArg.uuid,
            disabled: false,
            flags: { dae: { specialDuration: ["turnStart"] } },
            changes: [
                { key: `StatusEffect`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Poisoned", priority: 20 },
            ],
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
    } else {
        let effectData = {
            label: `${caster.name} Stench Immunity`,
            origin: lastArg.uuid,
            disabled: false,
            flags: { dae: { specialDuration: ["longRest"] } },
            changes: [
                { key: `flags.midi-qol.stenchImmunity`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: caster.name, priority: 20 },
            ],
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
    }
}