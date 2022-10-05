// grease
// macro.itemMacro - @attributes.spelldc
// aura - all, 10ft, check height, apply effect

if(!game.modules.get("ActiveAuras")?.active) {
  ui.notifications.error("ActiveAuras is not enabled");
  return;
};

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

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

async function applyItem(sourceItem, saveDC) {
    const itemData = mergeObject(
        duplicate(sourceItem.data),
        {
            type: "feat",
            effects: [
                {
                    changes: [{ key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Prone", priority: 20, }],
                    disabled: false,
                    label: sourceItem.name,
                    origin: sourceItem.uuid,
                    transfer: false
                }
            ],
            flags: {
                "midi-qol": {
                    onUseMacroName: null, // no macro
                },
            },
            data: {
                equipped: true,
                actionType: "save",
                save: { dc: saveDC, ability: "dex", scaling: "flat" },
                "target.type": "self",
                components: { concentration: false, material: false, ritual: false, somatic: false, value: "", vocal: false },
                duration: { units: "inst", value: undefined },
            },
        },
        { overwrite: true, inlace: true, insertKeys: true, insertValues: true }
    );
    const item = new CONFIG.Item.documentClass(itemData, { parent: tactor });
    const options = { showFullCard: false, createWorkflow: true, versatile: false, configureDialog: false };
    await MidiQOL.completeItemRoll(item, options);
};

if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    return await AAhelpers.applyTemplate(args);
} else if (args[0] === "on" && !tactor.effects.find(i => i.data.label === "Prone")) {
    const sourceItem = await fromUuid(lastArg.efData.origin);
    const saveDC = args[1];
    if (!sourceItem || !saveDC) return;
    await applyItem(sourceItem, saveDC);
} else if (args[0] === "each" && !tactor.effects.find(i => i.data.label === "Prone")) {
    const sourceItem = await fromUuid(lastArg.efData.origin);
    const saveDC = args[1];
    if (!sourceItem || !saveDC) return;
    await applySaveAdvantage();
    await applyItem(sourceItem, saveDC);
};