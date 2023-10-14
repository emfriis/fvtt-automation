try {
    if (args[0].tag !== "OnUse" || args[0].macroPass !== "postActiveEffects") return;
    const options = ["Acid", "Cold", "Fire", "Lightning", "Poison"];
    const optionContent = options.map((o) => { return `<option value="${o}">${o}</option>` });
    let dialog = new Promise((resolve,) => {
        new Dialog({
            title: "Absorb Elements: Choose a Damage Type",
            content: `<div class="form-group"><label>Damage Types: </label><select name="types"}>${optionContent}</select></div>`,
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
    type = await dialog;
    if (!type) return;
    let effectData = {
        label: "Absorb Elements",
        icon: "icons/magic/lightning/orb-ball-spiral-blue.webp",
        changes: [{ key: `data.traits.dr.value`, mode: 2, value: type.toLowerCase(), priority: 20 }],
        disabled: false,
        duration: { rounds: 1 },
        flags: { 
            dae: { specialDuration: ["turnStartSource"] },
            effectmacro: { onDelete: { script: 'try {\nlet type = actor.flags["midi-qol"].absorbElements?.type;\nlet level = actor.flags["midi-qol"].absorbElements?.level;\nlet effectData = {\nlabel: "Absorb Elements Damage Bonus",\nicon: "icons/magic/lightning/orb-ball-spiral-blue.webp",\nchanges: [\n{ key: "system.bonuses.mwak.attack", mode: 2, value: `${level}d6[${type}]`, priority: 20 },\n{ key: "system.bonuses.msak.attack", mode: 2, value: `${level}d6[${type}]`, priority: 20 },\n],\ndisabled: false,\nduration: { turns: 1 },\nflags: { dae: { specialDuration: ["1Hit:mwak", "1Hit:msak"] } },\n}\nawait actor.unsetFlag("midi-qol", "absorbElements");\nawait MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [effectData] });\n} catch (err) {console.error("Absorb Elements Macro - ", err)}' } }
        }
    }
    await args[0].actor.setFlag("midi-qol", "absorbElements", { type: type.toLowerCase(), level: args[0].spellLevel });
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
} catch (err) {console.error("Absorb Elements Macro - ", err)}

try {
    let type = actor.flags["midi-qol"].absorbElements?.type;
    let level = actor.flags["midi-qol"].absorbElements?.level;
    let effectData = {
        label: "Absorb Elements Damage Bonus",
        icon: "icons/magic/lightning/orb-ball-spiral-blue.webp",
        changes: [
            { key: "system.bonuses.mwak.attack", mode: 2, value: `${level}d6[${type}]`, priority: 20 },
            { key: "system.bonuses.msak.attack", mode: 2, value: `${level}d6[${type}]`, priority: 20 },
        ],
        disabled: false,
        duration: { turns: 1 },
        flags: { dae: { specialDuration: ["1Hit:mwak", "1Hit:msak"] } },
    }
    await actor.unsetFlag("midi-qol", "absorbElements");
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [effectData] });
} catch (err) {console.error("Absorb Elements Macro - ", err)}

'try {\nlet type = actor.flags["midi-qol"].absorbElements?.type;\nlet level = actor.flags["midi-qol"].absorbElements?.level;\nlet effectData = {\nlabel: "Absorb Elements Damage Bonus",\nicon: "icons/magic/lightning/orb-ball-spiral-blue.webp",\nchanges: [\n{ key: "system.bonuses.mwak.attack", mode: 2, value: `${level}d6[${type}]`, priority: 20 },\n{ key: "system.bonuses.msak.attack", mode: 2, value: `${level}d6[${type}]`, priority: 20 },\n],\ndisabled: false,\nduration: { turns: 1 },\nflags: { dae: { specialDuration: ["1Hit:mwak", "1Hit:msak"] } },\n}\nawait actor.unsetFlag("midi-qol", "absorbElements");\nawait MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [effectData] });\n} catch (err) {console.error("Absorb Elements Macro - ", err)}'