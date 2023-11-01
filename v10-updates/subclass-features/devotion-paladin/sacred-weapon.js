try {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
	const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    if (args[0] === "on") {
        const equipped = actor.items.filter(i => i.type === "weapon" && i.system.equipped && ["simple","martial"].find(t => i.system.weaponType.toLowerCase().includes(t)));
        if (equipped.length == 1) {
            const weapon = equipped[0];
            if (weapon.flags["midi-qol"].tempSystem) await weapon.setFlag("midi-qol", "tempSystem", weapon.flags["midi-qol"].tempSystem.concat([{ source: "sacredWeapon", id: lastArg.efData._id, system: { properties: { mgc: true } }, attackBonus: "@abilities.cha.mod" }]));
			if (!weapon.flags["midi-qol"].tempSystem) await weapon.setFlag("midi-qol", "tempSystem", [{ source: "core", id: weapon.id, system: JSON.parse(JSON.stringify(weapon.system)) }, { source: "sacredWeapon", id: lastArg.efData._id, system: { properties: { mgc: true } }, attackBonus: "@abilities.cha.mod" }]); 
			await weapon.setFlag("midi-qol", "sacredWeapon", lastArg.efData._id);
			await weapon.update({
                name: weapon.name + " (Sacred Weapon)",
                system: { attackBonus: weapon.system.attackBonus + "+@abilities.cha.mod", properties: { mgc: true } }
            });
        } else {
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
                <form class="weapon">
                <div class="form-group" id="weapons">
                    ${weaponContent}
                </div>
                </form>
            `;
            new Dialog({
                title: "Sacred Weapon: Choose a weapon",
                content,
                buttons: {
                    Confirm: { 
                        label: "Confirm",
                        callback: async () => {
                            const weapon = actor.items.find(i => i.id == $("input[type='radio'][name='weapon']:checked").val()); 
                            if (weapon.flags["midi-qol"].tempSystem) await weapon.setFlag("midi-qol", "tempSystem", weapon.flags["midi-qol"].tempSystem.concat([{ source: "sacredWeapon", id: lastArg.efData._id, system: { properties: { mgc: true } }, attackBonus: "@abilities.cha.mod" }]));
							if (!weapon.flags["midi-qol"].tempSystem) await weapon.setFlag("midi-qol", "tempSystem", [{ source: "core", id: weapon.id, system: JSON.parse(JSON.stringify(weapon.system)) }, { source: "sacredWeapon", id: lastArg.efData._id, system: { properties: { mgc: true } }, attackBonus: "@abilities.cha.mod" }]); 
							await weapon.setFlag("midi-qol", "sacredWeapon", lastArg.efData._id);
							await weapon.update({
                                name: weapon.name + " (Sacred Weapon)",
                                system: { attackBonus: weapon.system.attackBonus + `+@abilities.cha.mod`, properties: { mgc: true } }
                            });
                        }
                    },
                    Cancel: { label: "Cancel" },
                },
            }).render(true);
        }
    } else if (args[0] === "off") { 
        const weapon = actor.items.find(i => i.flags["midi-qol"].sacredWeapon === lastArg.efData._id);
        if (!weapon) weapon = game.actors.contents.find(a => a.items.find(i => i.flags["midi-qol"].sacredWeapon === lastArg.efData._id)).items.find(i => i.flags["midi-qol"].sacredWeapon === lastArg.efData._id);
		await weapon.setFlag("midi-qol", "tempSystem", weapon.flags["midi-qol"].tempSystem.filter(s => s.source !== "sacredWeapon" && s.id !== lastArg.efData._id));
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
			name: weapon.name.replace(" (Sacred Weapon)", ""),
			system: tempSystem
		});
		if (weapon.flags["midi-qol"].tempSystem.length < 2) weapon.unsetFlag("midi-qol", "tempSystem"); 
		weapon.unsetFlag("midi-qol", "sacredWeapon"); 
    } 
} catch (err) {console.error("Sacred Weapon Macro - ", err);}