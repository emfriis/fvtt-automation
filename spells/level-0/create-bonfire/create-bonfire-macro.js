// create bonfire
// macro.execute - CreateBonfire @details.level @details.cr @attributes.spelldc
// aura - all, check height, apply effect

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const template = canvas.templates.placeables.find(i => i.data.flags?.ActiveAuras?.IsAura[0]?.data?.origin === lastArg.efData.origin);

async function applySaveAdvantage() {
    const resist = ["Magic Resistance", "Spell Resistance"];
    const getResist = tactor.items.find(i => resist.includes(i.name)) || tactor.effects.find(i => resist.includes(i.data.label));
    if (getResist) {
        const effectData = {
            changes: [{ key: "flags.midi-qol.advantage.ability.save.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20, }],
            disabled: false,
            flags: { dae: { specialDuration: ["isSave"] } },
            label: `Save Advantage`,
        };
        await tactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    };
};

async function applyItem(damageDice, saveDC, damageType, saveType) {
    const itemData = {
        name: lastArg.efData.label,
        img: lastArg.efData.icon,
        type: "feat",
        "flags.midiProperties": {
            magiceffect: true,
            nodam: true,
            halfdam: false,
            fulldam: false,
        },
        data: {
            "activation.type": "none",
            actionType: "save",
            save: { dc: saveDC, ability: saveType, scaling: "flat" },
            damage: { parts: [[damageDice, damageType]] },
            target: { value: null, width: null, units: null, type: "creature" },
        },
    };
    const item = new CONFIG.Item.documentClass(itemData, { parent: tactor });
    const options = { showFullCard: false, createWorkflow: true, configureDialog: false, targetUuids: [lastArg.tokenUuid] };
    await MidiQOL.completeItemRoll(item, options);
};
  
if (args[0] === "on" || args[0] === "each") {
    if (VolumetricTemplates) {
        const templateTargets = VolumetricTemplates.compute3Dtemplate(template);
        if (templateTargets && !templateTargets.includes(lastArg.tokenId)) {
            await tactor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
            return;
        };
    };
    const damageDice = `${typeof args[1] === "int" ? 1 + Math.floor((args[1] + 1) / 6) : 1 + Math.floor((args[2] + 1) / 6)}d8`;
    const damageType = "fire";
    const saveDC = args[3];
    const saveType = "dex";
    if (!damageDice || !saveDC) return;
    await applySaveAdvantage();
    await applyItem(damageDice, saveDC, damageType, saveType);
};

/*
// create bonfire
// macro.execute - CreateBonfire @details.level @details.cr @attributes.spelldc
// aura - all, check height, apply effect

if (!game.modules.get("ActiveAuras")?.active) {
    ui.notifications.error("ActiveAuras is not enabled");
    return;
};
  
if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    return await AAhelpers.applyTemplate(args);
};
*/