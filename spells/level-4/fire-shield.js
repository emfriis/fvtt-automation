// fire shield
// on use post effects

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse" && lastArg.macroPass === "postActiveEffects") {

    const content = `
    <div class="form-group">
    <label>Damage Types : </label>
    <select name="types"}>
    <option value="cold">Chill Shield</option>
    <option value="fire">Warm Shield</option>
    </select>
    </div>
    `;
    let dialog = new Promise((resolve, reject) => {
        new Dialog({
            title: "Fire Shield: Choose a Shield Type",
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
    type = await dialog;
    if (!type) return;

    const effect = await tactor.effects.find(i => i.data.label === "Fire Shield");
    if (!effect) return;
    const updates =  {
        _id: effect.id,
        icon: type === "fire" ? "systems/dnd5e/icons/spells/protect-red-3.jpg" : "systems/dnd5e/icons/spells/protect-blue-3.jpg",
        label: type === "fire" ? "Warm Shield" : "Chill Shield",
        changes: [
            { key: "flags.midi-qol.thorns", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: `5,2d8,${type},magiceffect,spelleffect`, priority: 20 },
            { key: `data.traits.dr.value`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `${type === "fire" ? "cold" : "fire"}`, priority: 20 },
            { key: `ATL.light.color`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: `${type === "fire" ? "#ffbf00" : "#00ffff"}`, priority: 20 },
        ].concat(effect.data.changes),
    }
	await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [updates] });
}