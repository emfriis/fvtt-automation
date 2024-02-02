try {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
	const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
        const bonus = args[0].spellLevel > 5 ? 3 : args[0].spellLevel > 3 ? 2 : 1;
        args[0].targets.forEach(async target => {
            const equipped = target.actor.items.filter(i => i.type == "weapon" && i.system.equipped && !i.system.properties.mgc && ["simple","martial"].find(t => i.system.weaponType.toLowerCase().includes(t)));
            if (equipped.length) {
                let weaponContent = "";
                equipped.forEach((weapon) => { weaponContent += `<label class="radio-label"><input type="radio" name="weapon" value="${weapon.id}"><img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">${weapon.name}</label>`; });
                const content = `
                    <style>
                    .weapon .form-group { display: flex; flex-wrap: wrap; width: 100%; align-items: flex-start; }
                    .weapon .radio-label { display: flex; flex-direction: column; align-items: center; text-align: center; justify-items: center; flex: 1 0 25%; line-height: normal; }
                    .weapon .radio-label input { display: none; }
                    .weapon img { border: 0px; width: 50px; height: 50px; flex: 0 0 50px; cursor: pointer; }
                    .weapon [type=radio]:checked + img { outline: 2px solid #f00; }
                    </style>
                    <div style="display: flex; flex-direction: row; align-items: center; text-align: center; justify-content: center;">
                        <p>Targeting: </p>
                        <img src="${target.texture.src ?? target.document.texture.src}" style="border: 0px; width 50px; height: 50px;">
                    </div>
                    <form class="weapon">
                    <div class="form-group" id="weapons">
                        ${weaponContent}
                    </div>
                    </form>
                `;
                new Dialog({
                    title: "Magic Weapon: Choose a weapon",
                    content,
                    buttons: {
                        Confirm: { 
                            label: "Confirm",
                            callback: async () => {
                                const effectData = {
                                    name: "Magic Weapon",
                                    icon: "icons/magic/fire/dagger-rune-enchant-flame-blue.webp",
                                    changes: [{ key: "macro.execute", mode: 0, value: `Compendium.dnd-5e-core-compendium.macros.yQg2XQYvXN1JsVHU ${$("input[type='radio'][name='weapon']:checked").val()} ${bonus}`, priority: 20 }],
                                    duration: { seconds: 3600 },
                                    origin: args[0].uuid,
                                    disabled: false,
                                    isSuppressed: false
                                }
                                await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.uuid, effects: [effectData] });
                            }
                        },
                        Cancel: { label: "Cancel" },
                    },
                }).render(true);
            }
        });
    } else if (args[0] === "on") {
        const weapon = actor.items.find(i => i.id == args[1]); 
        const bonus = !isNaN(args[2]) ? `${args[2]}` : "1";
        if (weapon.flags["midi-qol"].tempSystem) { 
            await weapon.setFlag("midi-qol", "tempSystem", weapon.flags["midi-qol"].tempSystem.concat([{ source: "magicWeapon", id: lastArg.efData._id, system: { properties: { mgc: true } }, attackBonus: bonus, damageBonus: [[bonus, ""]]  }]));
        }
        if (!weapon.flags["midi-qol"].tempSystem) { 
            await weapon.setFlag("midi-qol", "tempSystem", [{ source: "core", id: weapon.id, system: JSON.parse(JSON.stringify(weapon.system)) }, { source: "magicWeapon", id: lastArg.efData._id, system: { properties: { mgc: true } }, attackBonus: bonus, damageBonus: [[bonus, ""]] }]); 
        }
        await weapon.setFlag("midi-qol", "magicWeapon", lastArg.efData._id);
        await weapon.update({
            name: weapon.name + " (Magic Weapon)",
            system: { attackBonus: weapon.system.attackBonus + "+" + bonus, properties: { mgc: true }, "damage.parts": weapon.system.damage.parts.concat([[bonus, ""]]), "damage.versatile": weapon.system.damage.versatile + "+" + bonus }
        });
    } else if (args[0] === "off") { 
        let weapon = actor.items.find(i => i.flags["midi-qol"].magicWeapon == lastArg.efData._id);
        if (!weapon) weapon = game.actors.contents.find(a => a.items.find(i => i.flags["midi-qol"].magicWeapon === lastArg.efData._id)).items.find(i => i.flags["midi-qol"].magicWeapon === lastArg.efData._id);
		await weapon.setFlag("midi-qol", "tempSystem", weapon.flags["midi-qol"].tempSystem.filter(s => s.source !== "magicWeapon" && s.id !== lastArg.efData._id));
		const tempSystem = JSON.parse(JSON.stringify(weapon.flags["midi-qol"].tempSystem.find(s => s.source === "core").system)); 
		weapon.flags["midi-qol"].tempSystem.filter(s => s.source !== "core").forEach(s => {
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
		await weapon.update({ "system.properties": tempProperties });
		await weapon.update({
			name: weapon.name.replace(" (Magic Weapon)", ""),
			system: tempSystem
		});
		if (weapon.flags["midi-qol"].tempSystem.length < 2) weapon.unsetFlag("midi-qol", "tempSystem"); 
		weapon.unsetFlag("midi-qol", "magicWeapon"); 
    } 
} catch (err) {console.error("Magic Weapon Macro - ", err);}