// fog cloud
// macro.execute - FogCloud
// aura - all, check height, apply effect

const lastArg = args[args.length - 1];
const tokenDoc = await fromUuid(lastArg.tokenUuid);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const template = canvas.templates.placeables.find(i => i.data.flags?.ActiveAuras?.IsAura[0]?.data?.origin === lastArg.efData.origin);

(async () => {
    if (args[0] === "on") {
        if (VolumetricTemplates) {
            const templateTargets = VolumetricTemplates.compute3Dtemplate(template);
            if (templateTargets && !templateTargets.includes(lastArg.tokenId)) {
                await tactor.deleteEmbeddedDocuments("ActiveEffect", [lastArg.effectId]);
                return;
            };
        };
        const senses = tactor.data.data.attributes.senses;
        let visionRange = Math.max(senses.blindsight, senses.tremorsense);
        await tokenDoc.setFlag('perfect-vision', 'sightLimit', visionRange);
    } else if (args[0] === "off") { // leaving aura vertically requires manual effect removal
        if (template && VolumetricTemplates) {
            const templateTargets = VolumetricTemplates.compute3Dtemplate(template);
            if (templateTargets && templateTargets.includes(lastArg.tokenId)) {
                return;
            };
        };
        // if (tactor.effects.find(i => i.data.label === "Blinded") && !tactor.data.data.traits.ci.value.includes("blinded")) // should check for already blinded
        await tokenDoc.setFlag('perfect-vision', 'sightLimit', null);
    };
})();

/*
// Fog Cloud
// macro.execute - FogCloud
// aura - all, check height, apply effect

if (!game.modules.get("ActiveAuras")?.active) {
    ui.notifications.error("ActiveAuras is not enabled");
    return;
};
  
if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    return await AAhelpers.applyTemplate(args);
};
*/