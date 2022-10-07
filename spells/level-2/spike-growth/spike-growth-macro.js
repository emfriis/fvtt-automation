// spike growth
// macro.execute - SpikeGrowth
// aura - all, check height, apply effect

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const template = canvas.templates.placeables.find(i => i.data.flags?.ActiveAuras?.IsAura[0]?.data?.origin === lastArg.efData.origin);

async function applyItem(damageDice, damageType) {
    const itemData = {
        name: lastArg.efData.label,
        img: lastArg.efData.icon,
        type: "feat",
        "flags.midiProperties": {
            magiceffect: true
        },
        data: {
            "activation.type": "none",
            actionType: "save",
            damage: { parts: [[damageDice, damageType]] },
            target: { value: null, width: null, units: null, type: "creature" },
        },
    };
    const item = new CONFIG.Item.documentClass(itemData, { parent: tactor });
    const options = { showFullCard: false, createWorkflow: true, configureDialog: false, targetUuids: [lastArg.tokenUuid] };
    await MidiQOL.completeItemRoll(item, options);
};
  
(async () => {
    if (args[0] === "on") {
        if (token?.data?.elevation > template?.data?.flags?.levels?.elevation + 5 || token?.data?.elevation + token?.losHeight < template?.data?.flags?.levels?.elevation) {
            await tactor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
            return;
        };
        const damageDice = "2d4";
        const damageType = "piercing";
        await applyItem(damageDice, damageType);
        await tactor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
    }; 
})();

/*
// spike growth
// macro.execute - SpikeGrowth
// aura - all, check height, apply effect

if (!game.modules.get("ActiveAuras")?.active) {
    ui.notifications.error("ActiveAuras is not enabled");
    return;
};
  
if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    return await AAhelpers.applyTemplate(args);
};
*/