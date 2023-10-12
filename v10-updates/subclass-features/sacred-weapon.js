try {
    const lastArg = args[args.length - 1];
    const actor = await fromUuid(lastArg.actorUuid);
    if (args[0] === "on") {
        const equipped = actor.items.filter(i => i.type === "weapon" && i.system.equipped);
        if (equipped.length == 1) {
            const weapon = equipped[0];
            weapon.update({
                name: weapon.name + " (Sacred Weapon)",
                system: { attackBonus: weapon.system.attackBonus + "+@abilities.cha.mod", properties: { mgc: true } },
                flags: { "midi-qol": { tempMgc: weapon.system.properties.mgc && !weapon.flags["midi-qol"]?.tempMgc ? 0 : weapon.flags["midi-qol"]?.tempMgc ? weapon.flags["midi-qol"]?.tempMgc + 1 : 1 } }
            });
        } else {
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
                title: "Sacred Weapon: Choose a weapon",
                content,
                buttons: {
                    Confirm: { 
                        label: "Confirm",
                        callback: () => {
                            const weapon = actor.items.find(i => i.id == $("input[type='radio'][name='weapon']:checked").val()); 
                            weapon.update({
                                name: weapon.name + " (Sacred Weapon)",
                                system: { attackBonus: weapon.system.attackBonus + `+@abilities.cha.mod`, properties: { mgc: true } },
                                flags: { "midi-qol": { tempMgc: weapon.system.properties.mgc && !weapon.flags["midi-qol"]?.tempMgc ? 0 : weapon.flags["midi-qol"]?.tempMgc ? weapon.flags["midi-qol"]?.tempMgc + 1 : 1 } }
                            });
                        }
                    },
                    Cancel: { label: "Cancel" },
                },
            }).render(true);
        }
    } else if (args[0] === "off") { 
        const weapon = actor.items.find(i => i.name.includes(" (Sacred Weapon)"));
        weapon.update({
            name: weapon.name.replace(" (Sacred Weapon)",""),
            system: { attackBonus: weapon.system.attackBonus.replace("+@abilities.cha.mod",""), properties: { mgc: weapon.flags["midi-qol"]?.tempMgc - 1 == 0 ? false : true } },
            flags: { "midi-qol": { tempMgc: weapon.flags["midi-qol"]?.tempMgc ? Math.max(weapon.flags["midi-qol"]?.tempMgc - 1, 0) : 0 } }
        });
    } 
} catch (err) {console.error("Sacred Weapon Macro - ", err);}