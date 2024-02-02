try {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
	const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
        args[0].targets.forEach(async target => {
            const equipped = target.actor.items.filter(i => (i.type == "weapon" && !i.system?.properties?.mgc && ["simple","martial"].find(t => i.system?.weaponType?.toLowerCase()?.includes(t))) || (i.type == "equipment" && i.system?.armor?.value && i.system?.armor?.type != "shield" && !i.system?.rarity));
            if (equipped.length) {
                let weaponOrArmorContent = "";
                equipped.forEach((weaponOrArmor) => { weaponOrArmorContent += `<label class="radio-label"><input type="radio" name="weaponOrArmor" value="${weaponOrArmor.id}"><img src="${weaponOrArmor.img}" style="border:0px; width: 50px; height:50px;">${weaponOrArmor.name}</label>`; });
                const content = `
                    <style>
                    .weaponOrArmor .form-group { display: flex; flex-wrap: wrap; width: 100%; align-items: flex-start; }
                    .weaponOrArmor .radio-label { display: flex; flex-direction: column; align-items: center; text-align: center; justify-items: center; flex: 1 0 25%; line-height: normal; }
                    .weaponOrArmor .radio-label input { display: none; }
                    .weaponOrArmor img { border: 0px; width: 50px; height: 50px; flex: 0 0 50px; cursor: pointer; }
                    .weaponOrArmor [type=radio]:checked + img { outline: 2px solid #f00; }
                    </style>
                    <div style="display: flex; flex-direction: row; align-items: center; text-align: center; justify-content: center;">
                        <p>Targeting: </p>
                        <img src="${target.texture.src ?? target.document.texture.src}" style="border: 0px; width 50px; height: 50px;">
                    </div>
                    <form class="weaponOrArmor">
                    <div class="form-group" id="weaponOrArmors">
                        ${weaponOrArmorContent}
                    </div>
                    </form>
                `;
                new Dialog({
                    title: "Blessing of the Forge: Choose an Item",
                    content,
                    buttons: {
                        Confirm: { 
                            label: "Confirm",
                            callback: async () => {
                                const effectData = {
                                    name: "Blessing of the Forge",
                                    icon: "icons/tools/smithing/furnace-fire-metal-orange.webp",
                                    changes: [{ key: "macro.execute", mode: 0, value: `Compendium.dnd-5e-core-compendium.macros.fjMpD92HT5hOjThS ${$("input[type='radio'][name='weaponOrArmor']:checked").val()}`, priority: 20 }],
                                    origin: args[0].uuid,
                                    disabled: false,
                                    isSuppressed: false,
                                    flags: { dae: { specialDuration: ["longRest"] } }
                                }
                                await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
                            }
                        },
                        Cancel: { label: "Cancel" },
                    },
                }).render(true);
            }
        });
    } else if (args[0] === "on") {
        const weaponOrArmor = actor.items.find(i => i.id == args[1]); 
        if (weaponOrArmor.type == "weapon") {
            if (weaponOrArmor.flags["midi-qol"].tempSystem) { 
                await weaponOrArmor.setFlag("midi-qol", "tempSystem", weaponOrArmor.flags["midi-qol"].tempSystem.concat([{ source: "blessingOfTheForge", id: lastArg.efData._id, system: { properties: { mgc: true } }, attackBonus: 1, damageBonus: [[1, ""]]  }]));
            }
            if (!weaponOrArmor.flags["midi-qol"].tempSystem) { 
                await weaponOrArmor.setFlag("midi-qol", "tempSystem", [{ source: "core", id: weaponOrArmor.id, system: JSON.parse(JSON.stringify(weaponOrArmor.system)) }, { source: "blessingOfTheForge", id: lastArg.efData._id, system: { properties: { mgc: true } }, attackBonus: 1, damageBonus: [[1, ""]] }]); 
            }
            await weaponOrArmor.setFlag("midi-qol", "blessingOfTheForge", lastArg.efData._id);
            await weaponOrArmor.update({
                name: weaponOrArmor.name + " (Blessing of the Forge)",
                system: { attackBonus: weaponOrArmor.system.attackBonus + "+1", properties: { mgc: true }, "damage.parts": weaponOrArmor.system.damage.parts.concat([[1, ""]]), "damage.versatile": weaponOrArmor.system.damage.versatile + "+1" }
            });
        } else if (weaponOrArmor.type == "equipment") {
            if (weaponOrArmor.flags["midi-qol"].tempSystem) { 
                await weaponOrArmor.setFlag("midi-qol", "tempSystem", weaponOrArmor.flags["midi-qol"].tempSystem.concat([{ source: "blessingOfTheForge", id: lastArg.efData._id, acBonus: 1 }]));
            }
            if (!weaponOrArmor.flags["midi-qol"].tempSystem) { 
                await weaponOrArmor.setFlag("midi-qol", "tempSystem", [{ source: "core", id: weaponOrArmor.id, system: JSON.parse(JSON.stringify(weaponOrArmor.system)) }, { source: "blessingOfTheForge", id: lastArg.efData._id, acBonus: 1 }]); 
            }
            await weaponOrArmor.setFlag("midi-qol", "blessingOfTheForge", lastArg.efData._id);
            await weaponOrArmor.update({
                name: weaponOrArmor.name + " (Blessing of the Forge)",
                system: { armor: { value: weaponOrArmor.system.armor.value + 1 } }
            });
        }
    } else if (args[0] === "off") { 
        let weaponOrArmor = actor.items.find(i => i.flags["midi-qol"].blessingOfTheForge == lastArg.efData._id);
        if (!weaponOrArmor) weaponOrArmor = game.actors.contents.find(a => a.items.find(i => i.flags["midi-qol"].blessingOfTheForge === lastArg.efData._id)).items.find(i => i.flags["midi-qol"].blessingOfTheForge === lastArg.efData._id);
		await weaponOrArmor.setFlag("midi-qol", "tempSystem", weaponOrArmor.flags["midi-qol"].tempSystem.filter(s => s.source !== "blessingOfTheForge" && s.id !== lastArg.efData._id));
		const tempSystem = JSON.parse(JSON.stringify(weaponOrArmor.flags["midi-qol"].tempSystem.find(s => s.source === "core").system)); 
        if (weaponOrArmor.type == "weapon") {
            weaponOrArmor.flags["midi-qol"].tempSystem.filter(s => s.source !== "core").forEach(s => {
                mergeObject(tempSystem, s.system);
                if (s.attackBonus) tempSystem.attackBonus = tempSystem.attackBonus + "+" + s.attackBonus;
                if (s.damageBonus) {
                    tempSystem.damage.parts = tempSystem.damage.parts.concat(s.damageBonus);
                    s.damageBonus.forEach(p => tempSystem.damage.versatile = tempSystem.damage.versatile + "+" + `${p[0]}` + (p[1] ? `[${p[1]}]` : ""));
                }
                if (s.dieReplace) {
                    const parts = tempSystem.damage.parts;
                    parts[0][0] = parts[0][0].replace(new RegExp(s.dieReplace[0]), s.dieReplace[1]);
                    tempSystem.damage.parts = parts;
                }
            });
            const tempProperties = mergeObject({ ada: false, amm: false, fin: false, fir: false, foc: false, hvy: false, lgt: false, lod: false, mgc: false, rch: false, rel: false, ret: false, sil: false, spc: false, thr: false, two: false, ver: false }, tempSystem.properties);
            await weaponOrArmor.update({ "system.properties": tempProperties });
            await weaponOrArmor.update({
                name: weaponOrArmor.name.replace(" (Blessing of the Forge)", ""),
                system: tempSystem
            });
            if (weaponOrArmor.flags["midi-qol"].tempSystem.length < 2) weaponOrArmor.unsetFlag("midi-qol", "tempSystem"); 
            weaponOrArmor.unsetFlag("midi-qol", "blessingOfTheForge");
        } else if (weaponOrArmor.type == "equipment") {
            weaponOrArmor.flags["midi-qol"].tempSystem.filter(s => s.source !== "core").forEach(s => {
                mergeObject(tempSystem, s.system);
                if (s.acBonus) tempSystem.armor.value = tempSystem.armor.value + s.acBonus;
            });
            await weaponOrArmor.update({
                name: weaponOrArmor.name.replace(" (Blessing of the Forge)", ""),
                system: tempSystem
            });
            if (weaponOrArmor.flags["midi-qol"].tempSystem.length < 2) weaponOrArmor.unsetFlag("midi-qol", "tempSystem"); 
            weaponOrArmor.unsetFlag("midi-qol", "blessingOfTheForge");
        } 
    } 
} catch (err) {console.error("Blessing of the Forge Macro - ", err);}