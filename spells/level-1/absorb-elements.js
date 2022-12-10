// absorb elements

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse") {
    const itemD = lastArg.item;
    const spellLevel = lastArg.spellLevel;
    let elements = ["acid", "cold", "fire", "lightning", "poison"];
    let damageDetail = args[0].workflowOptions.damageDetail;
    let options = [];
    Object.keys(damageDetail).forEach((key) => {
        if (elements.includes(damageDetail[key].type.toLowerCase())) {
            options.push(damageDetail[key].type.toLowerCase())
        }
    })
    let type;
    if (options.length === 0) {
        return ui.notifications.error(`The spell fizzles, No elemental damage found`);
    } else if (options.length === 1) {
        type = options[0];
    } else {
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
                title: "Absorb Elements: Choose a damage type to resist",
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
    }
    if (!type) return;
    let effectData = [{
        label: itemD.name,
        icon: itemD.img,
        changes: [
            { key: `data.traits.dr.value`, mode: 2, value: type, priority: 20 },
            { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `${type} ${spellLevel}`, priority: 20 },
        ],
        origin: lastArg.uuid,
        disabled: false,
        flags: { dae: { specialDuration: ["turnStartSource"], itemData: itemD } , core: { statusId: "Absorb Elements" }},
    }]
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
}

if (args[0] === "off" && lastArg["expiry-reason"] === "times-up:duration-special") {
    let type = args[1];
    let level = args[2];
    let gameRound = game.combat ? game.combat.rounds : 0;
    let effectData = [{
        label: "Absorb Elements Damage Bonus",
        icon: "systems/dnd5e/icons/skills/weapon_25.jpg",
        changes: [
            { key: "flags.dnd5e.DamageBonusMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.Absorb Elements`, priority: 20 },
            { key: "flags.midi-qol.absorbType", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: `${type}`, priority: 20 },
            { key: "flags.midi-qol.absorbLevel", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: `${level}`, priority: 20 },
        ],
        disabled: false,
        duration: {turns: 1, startTime: game.time.worldTime, startRound: gameRound },
        flags: { dae: { specialDuration: ["1Attack:mwak"] } },
    }]
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
}

if (args[0].tag === "DamageBonus") {
    if (!["mwak"].includes(lastArg.item.data.actionType)) return;
    let type = getProperty(tactor.data.flags, "midi-qol.absorbType");
    let level = getProperty(tactor.data.flags, "midi-qol.absorbLevel");
    const diceMult = args[0].isCritical ? level * 2 : level;
    return { damageRoll: `${diceMult}d6[${type}]`, flavor: `(Absorb Elements (${CONFIG.DND5E.damageTypes[type]}))` };
}