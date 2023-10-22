try {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
	const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    if (args[0] === "on") {
        const equipped = actor.items.filter(i => i.type === "weapon" && i.system.equipped && ["quarterstaff", "club"].includes(i.system.baseItem));
        if (equipped.length == 1) {
            const weapon = equipped[0];
            const parts = weapon.system.damage.parts;
            parts[0][0] = parts[0][0].replace(/d(4|6)/, "d8"); 
            if (weapon.flags["midi-qol"].tempSystem) await weapon.setFlag("midi-qol", "tempSystem", weapon.flags["midi-qol"].tempSystem.concat([{ source: "shillelagh", id: lastArg.efData._id, system: { properties: { mgc: true }, ability: `${actor.system.attributes.spellcasting ? actor.system.attributes.spellcasting : "int"}` }, dieReplace: [/d(4|6)/, "d8"] }]));
			if (!weapon.flags["midi-qol"].tempSystem) await weapon.setFlag("midi-qol", "tempSystem", [{ source: "core", id: weapon.id, system: JSON.parse(JSON.stringify(weapon.system)) }, { source: "shillelagh", id: lastArg.efData._id, system: { properties: { mgc: true }, ability: `${actor.system.attributes.spellcasting ? actor.system.attributes.spellcasting : "int"}` }, dieReplace: [/d(4|6)/, "d8"] }]); 
			await weapon.setFlag("midi-qol", "shillelagh", lastArg.efData._id);
			await weapon.update({
                name: weapon.name + " (Shillelagh)",
				system: { ability: `${actor.system.attributes.spellcasting ? actor.system.attributes.spellcasting : "int"}`, properties: { mgc: true }, "damage.parts": parts}
			});
        } else if (equipped.length > 1) {
            let weapon_content = "";
            equipped.forEach((weapon) => { weapon_content += `<label class="radio-label"><input type="radio" name="weapon" value="${weapon.id}"><img src="${weapon.img}" style="border:0px; width: 50px; height:50px;">${weapon.name}</label>`; });
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
                    ${weapon_content}
                </div>
                </form>
            `;
            new Dialog({
                title: "Shillelagh: Choose a weapon",
                content,
                buttons: {
                    Confirm: { 
                        label: "Confirm",
                        callback: async () => {
                            const weapon = actor.items.find(i => i.id == $("input[type='radio'][name='weapon']:checked").val());
                            const parts = weapon.system.damage.parts;
                            parts[0][0] = parts[0][0].replace(/d(4|6)/, "d8"); 
							if (weapon.flags["midi-qol"].tempSystem) await weapon.setFlag("midi-qol", "tempSystem", weapon.flags["midi-qol"].tempSystem.concat([{ source: "shillelagh", id: lastArg.efData._id, system: { properties: { mgc: true }, ability: `${actor.system.attributes.spellcasting ? actor.system.attributes.spellcasting : "int"}` }, dieReplace: [/d(4|6)/, "d8"] }]));
							if (!weapon.flags["midi-qol"].tempSystem) await weapon.setFlag("midi-qol", "tempSystem", [{ source: "core", id: weapon.id, system: JSON.parse(JSON.stringify(weapon.system)) }, { source: "shillelagh", id: lastArg.efData._id, system: { properties: { mgc: true }, ability: `${actor.system.attributes.spellcasting ? actor.system.attributes.spellcasting : "int"}` }, dieReplace: [/d(4|6)/, "d8"] }]); 
							await weapon.setFlag("midi-qol", "shillelagh", lastArg.efData._id);
							await weapon.update({
								name: weapon.name + " (Shillelagh)",
								system: { ability: `${actor.system.attributes.spellcasting ? actor.system.attributes.spellcasting : "int"}`, properties: { mgc: true }, "damage.parts": parts }
							});
                        }
                    },
                    Cancel: { label: "Cancel" },
                },
            }).render(true);
        } else {
			ui.notifications.warn("No Eligible Weapon");
		}
    } else if (args[0] === "off") { 
        const weapon = actor.items.find(i => i.flags["midi-qol"].shillelagh === lastArg.efData._id);
		await weapon.setFlag("midi-qol", "tempSystem", weapon.flags["midi-qol"].tempSystem.filter(s => s.source !== "shillelagh" && s.id !== lastArg.efData._id));
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
                parts[0][0] = parts[0][0].replace(s.dieReplace[0], s.dieReplace[1]);
                tempSystem.damage.parts = parts;
            }
        });
		const tempProperties = mergeObject({ ada: false, amm: false, fin: false, fir: false, foc: false, hvy: false, lgt: false, lod: false, mgc: false, rch: false, rel: false, ret: false, sil: false, spc: false, thr: false, two: false, ver: false }, tempSystem.properties);
		await weapon.update({ "system.properties": tempProperties });
		await weapon.update({
			name: weapon.name.replace(" (Shillelagh)", ""),
			system: tempSystem
		});
		if (weapon.flags["midi-qol"].tempSystem.length < 2) weapon.unsetFlag("midi-qol", "tempSystem"); 
		weapon.unsetFlag("midi-qol", "shillelagh"); 
    } 
} catch (err) {console.error("Shillelagh Macro - ", err);}