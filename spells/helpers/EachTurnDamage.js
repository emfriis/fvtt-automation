const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function applyDamage(damageDice, damageType, saveDC, saveType, saveDamage, magicEffect) {
    const itemData = {
        name: `${damageType.charAt(0).toUpperCase() + damageType.slice(1)} Damage`,
        img: lastArg.efData.icon,
        type: "feat",
        flags: {
            midiProperties: {
                magiceffect: magicEffect === "magiceffect" ? true : false,
                nodam: saveDamage === "nodam" ? true : false,
                halfdam: saveDamage === "halfdam" ? true : false
            }
        },
        data: {
            "activation.type": "none",
            actionType: saveDC === "none" ? "other" : "save",
            damage: { parts: [[damageDice, damageType]] },
            save: { dc: saveDC === "none" ? null : parseInt(saveDC), ability: saveType === "none" ? null : saveType, scaling: "flat" },
            target: { value: null, width: null, units: null, type: "self" },
        }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: tactor });
    const options = { showFullCard: false, createWorkflow: true, configureDialog: false };
    await MidiQOL.completeItemRoll(item, options);
};

if (args[0] === "each") {
    await applyDamage(args[1], args[2], args[3], args[4], args[5], args[6]);
}