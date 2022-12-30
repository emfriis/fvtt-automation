// elemental bane
// on use post saves

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.failedSaveUuids.length !== 0) {
    const options = ["acid", "cold", "fire", "lightning", "thunder"];
    const optionContent = options.map((o) => { return `<option value="${o}">${CONFIG.DND5E.damageTypes[o]}</option>` })
    const content = `
    <div class="form-group">
    <label>Damage Types : </label>
    <select name="types"}>
    ${optionContent}
    </select>
    </div>
    `;
    let dialog = new Promise((resolve, reject) => {
        new Dialog({
            title: "Elemental Bane: Choose a Damage Type",
            content,
            buttons: {
                Ok: {
                    label: "Ok",
                    callback: (html) => {resolve(html.find("[name=types]")[0].value)},
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
    const tokenOrActorTarget = await fromUuid(lastArg.failedSaveUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
    const conc = tactor.effects.find(e => e.data.label === "Concentrating");
    const gameRound = game.combat ? game.combat.round : 0;
    const durationType = lastArg.item.data.duration.units;
    const duration = durationType === "second" ? lastArg.item.data.duration.value * 6 : durationType === "minute" ? lastArg.item.data.duration.value * 10 : durationType === "hour" ? lastArg.item.data.duration.value * 600 : lastArg.item.data.duration.value;
    const effectData = {
        label: lastArg.item.name,
        icon: lastArg.item.img,
        changes: [
            { key: `data.traits.dv.value`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: tactorTarget.data.data.traits.dr.value.includes(type) ? `${type}` : ``, priority: 20 },
            { key: `flags.midi-qol.elementalBane`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: type, priority: 20 },
        ],
        origin: lastArg.uuid,
        disabled: false,
        duration: { rounds: duration, startRound: gameRound, startTime: game.time.worldTime },
        flags: { "dae": { itemData: lastArg.item, token: tactorTarget.uuid, } },
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
    if (conc) {
        let concUpdate = await getProperty(tactor.data.flags, "midi-qol.concentration-data.targets");
        await concUpdate.push({ tokenUuid: tokenOrActorTarget.uuid, actorUuid: tactorTarget.uuid });
        await tactor.setFlag("midi-qol", "concentration-data.targets", concUpdate);
    }
}