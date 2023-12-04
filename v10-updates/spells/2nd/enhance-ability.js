try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects") return;
    const options = [{ key: "Constitution", value: "con" }, { key: "Strength", value: "str" }, { key: "Dexterity", value: "dex" }, { key: "Charisma", value: "cha" }, { key: "Intelligence", value: "int" }, { key: "Wisdom", value: "wis" }];
    const optionContent = options.map((o) => { return `<option value="${o.value}">${o.key}</option>` });
    let dialog = new Promise((resolve) => {
        new Dialog({
        title: "Usage Configuration: Enhance Ability",
        content: `
        <p>Choose an ability to enhance:</p>
        <div><label>Ability: </label><select name="abilities"}>${optionContent}</select></div>
        `,
        buttons: {
            confirm: {
                label: "Confirm",
                callback: () => resolve($("[name=abilities]")[0].value)
            },
            cancel: {
                label: "Cancel",
                callback: () => {resolve(fase)}
            }
        },
        default: "cancel",
        close: () => {resolve(false)}
        }).render(true);
    });
    let ability = await dialog;
    if (!ability) return;
    args[0].targets.forEach(async t => {
        const effectData = {
			changes: [{ key: `flags.midi-qol.advantage.ability.check.${ability}`, mode: 0, value: "1", priority: 20 }],
			disabled: false,
			origin: args[0].item.uuid,
			name: args[0].item.name,
            icon: args[0].item.img,
			duration: { seconds: 3600 }
		}
        if (ability == "con") effectData.changes.push({ key: "macro.actorUpdate", mode: 0, value: `${t.actor.uuid} number '${args[0].damageTotal}' system.attributes.hp.temp '0'`, priority: 20 });
        if (ability == "str") effectData.changes.push({ key: "flags.dnd5e.powerfulBuild", mode: 0, value: "1", priority: 20 });
		await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: t.actor.uuid, effects: [effectData] });
    });
} catch (err) {console.error("Enhance Ability Macro - ", err)}