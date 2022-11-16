// destructive wrath

const tokenOrActor = await fromUuid(args[0].actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;

if (args[0].tag === "OnUse" && args[0].hitTargets.length > 0) {
    const resourceList = [{ name: "primary" }, { name: "secondary" }, { name: "tertiary" }];
    const resourceValues = Object.values(tactor.data.data.resources);
    const resourceTable = mergeObject(resourceList, resourceValues);
    const abilityName = "Channel Divinity";
    const findResourceSlot = resourceTable.find(i => i.label.toLowerCase() === abilityName.toLowerCase());
    if (!findResourceSlot) return ui.notifications.error(`<strong>REQUIRED</strong>: Please add "<strong>${abilityName}</strong>" as one of your <strong>Resources</strong>.`);
    if (findResourceSlot.value < 1) return;
    const resourceSlot = findResourceSlot.name;
    if (args[0].item.data.damage.parts[0][1] !== "lighting" && args[0].item.data.damage.parts[0][1] !== "thunder") return;
    let useFeat = await new Promise((resolve, reject) => {
        new Dialog({
            title: "Channel Divinity: Destructive Wrath",
            content: "Use Feature?",
            buttons: {
                Confirm: {
                    label: "Confirm",
                    callback: async () => {resolve(true)},
                },
                Cancel: {
                    label: "Cancel",
                    callback: async () => {resolve(false)},
                },
            },
            default: "Cancel",
            close: () => {resolve(false)}
        }).render(true);
    });
    if (!useFeat) return;

    let effectData = [{
        changes: [
            { key: `flags.midi-qol.max.damage.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 }
        ],
        disabled: false,
        icon: args[0].item.img,
        label: "Destructive Wrath",
        flags: { "dae": { itemData: args[0].item, specialDuration: ["1Spell"] } },
    }];
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: effectData });

    let actor_data = duplicate(tactor.data._source);
    actor_data.data.resources[resourceSlot].value = Math.max(0, actor_data.data.resources[resourceSlot].value - 1);
    await tactor.update(actor_data);
}