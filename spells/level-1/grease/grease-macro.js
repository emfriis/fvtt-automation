// grease
// macro.execute - Grease @attributes.spelldc
// aura - all, check height, apply effect
  
const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const template = canvas.templates.placeables.find(i => i.data.flags?.ActiveAuras?.IsAura[0]?.data?.origin === lastArg.efData.origin);

async function applySaveAdvantage() {
    const resist = ["Magic Resistance", "Spell Resistance", "Sure-Footed", "Prone Resilience"];
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

async function applyItem(saveDC, saveType) {
    const itemData = {
        name: lastArg.efData.label,
        img: lastArg.efData.icon,
        type: "feat",
        "flags.midiProperties": {
            magiceffect: true,
        },
        effects: [
            {
                changes: [{ key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Prone", priority: 20, }],
                disabled: false,
                label: lastArg.efData.label,
                icon: lastArg.efData.icon,
                transfer: false
            }
        ],
        data: {
            "activation.type": "none",
            actionType: "save",
            save: { dc: saveDC, ability: saveType, scaling: "flat" },
            target: { value: null, width: null, units: null, type: "creature" },
        },
    };
    const item = new CONFIG.Item.documentClass(itemData, { parent: tactor });
    const options = { showFullCard: false, createWorkflow: true, configureDialog: false, targetUuids: [lastArg.tokenUuid] };
    await MidiQOL.completeItemRoll(item, options);
};
  
if ((args[0] === "on" || args[0] === "each") && !tactor.effects.find(i => i.data.label === "Prone")) {
    if (token?.data?.elevation > template?.data?.flags?.levels?.elevation + 5 || token?.data?.elevation + token?.losHeight < template?.data?.flags?.levels?.elevation) {
        await tactor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
        return;
    };
    const saveDC = args[1];
    if (!saveDC) return;
    await applySaveAdvantage();
    await applyItem(saveDC, "dex");
};

/*
// grease
// macro.execute - Grease @attributes.spelldc
// aura - all, check height, apply effect

if (!game.modules.get("ActiveAuras")?.active) {
    ui.notifications.error("ActiveAuras is not enabled");
    return;
};
  
if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    return await AAhelpers.applyTemplate(args);
};
*/