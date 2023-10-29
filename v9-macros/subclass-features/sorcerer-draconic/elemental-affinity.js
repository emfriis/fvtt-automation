// elemental affinity
// damage bonus

if (args[0].tag === "DamageBonus" && args[0].item.type === "spell" && args[0].item.data.damage.parts.length && args[0].item.data.damage.parts.find(p => p[1].toLowerCase() === args[0].actorData.flags["midi-qol"].draconicAncestorType?.toLowerCase())) {
    try {
        const damageType = args[0].actorData.flags["midi-qol"].draconicAncestorType?.toLowerCase();
        const usesItem = args[0].actor.items.find(i => i.name === "Sorcery Points");
        if (usesItem && usesItem.data.data.uses.value) {
            let affinityDialog = new Promise(async (resolve, reject) => {
                new Dialog({
                    title: "Elemental Affinity",
                    content: `<p>Spend 1 Sorcery Point to gain resistance to ${damageType} for 1 hour?</p>`,
                    buttons: {
                        Ok: {
                            label: "Ok",
                            callback: () => { resolve(true) },
                        },
                        Cancel: {
                            label: "Cancel",
                            callback: () => { resolve(false) },
                        },
                    },
                    default: "Cancel",
                    close: () => { resolve(false) },
                }).render(true);
            });
            let useFeat = await affinityDialog;
            if (useFeat) {
                const effectData = [{
                    changes: [{ key: "data.traits.dr.value", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: damageType, priority: 20, },],
                    disabled: false,
                    label: "Elemental Affinity",
                    icon: "icons/magic/water/projectile-icecicles-salvo.webp",
                    duration: { seconds: 3600, startTime: game.time.worldTime },
                }]
                MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actorUuid, effects: effectData });
                usesItem.update({ "data.uses.value": Math.max(0, usesItem.data.data.uses.value - 1) });
                return { damageRoll: `${args[0].actorData.data.abilities.cha.mod}[${damageType}]`, flavor: "Elemental Affinity" }
            } else {
                return { damageRoll: `${args[0].actorData.data.abilities.cha.mod}[${damageType}]`, flavor: "Elemental Affinity" }
            }
        } else {
            return { damageRoll: `${args[0].actorData.data.abilities.cha.mod}[${damageType}]`, flavor: "Elemental Affinity" }
        }

    } catch (err) {
        console.error("Elemental Affinity error", err);
    }
}