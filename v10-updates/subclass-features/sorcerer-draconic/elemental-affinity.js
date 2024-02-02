try {
    const type = args[0].actor.flags["midi-qol"]?.dragonAncestor.toLowerCase();
    if (!type || args[0].item.type != "spell" || ((type !=  args[0].newDefaultDamageType ?? args[0].defaultDamageType.toLowerCase()) && !args[0].damageRoll?.dice?.find(d => type == d.flavor.toLowerCase()))) return;
    if (args[0].tag == "OnUse" && args[0].macroPass == "postDamageRoll" && args[0].damageRoll) {
        let bonusRoll = await new Roll('0 + ' + `${args[0].actor.system.abilities.cha.mod}`).evaluate({async: true});
        for (let i = 1; i < bonusRoll.terms.length; i++) {
            args[0].damageRoll.terms.push(bonusRoll.terms[i]);
        }
        args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${args[0].actor.system.abilities.cha.mod}`;
        args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
        await args[0].workflow.setDamageRoll(args[0].damageRoll);
    } else if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects" && !args[0].actor.system.details.dr.includes(type)) {
        const item = args[0].actor.items.find(i => i.name == "Font of Magic" && i.system?.uses?.value);
        if (item) new Dialog({
            title: "Elemental Affinity",
            content: `Spend 1 Sorcery Point to gain resistance to ${type} damage for 1 hour?`,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: async () => {
                        const effectData = [{
                            changes: [{ key: "data.traits.dr.value", mode: 0, value: type, priority: 20, },],
                            disabled: false,
                            name: "Elemental Affinity",
                            icon: "icons/magic/water/projectile-icecicles-salvo.webp",
                            duration: { seconds: 3600 }
                        }];
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: effectData });
                        await item.update({ "data.uses.value": Math.max(0, item.system.uses.value - 1) });
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel"
                }
            }
        }).render(true);
    }
} catch (err) {console.error("Elemental Affinity Macro - ", err)}