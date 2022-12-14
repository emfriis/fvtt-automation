// fog cloud
// macro.execute - FogCloud
// aura - all, check height, apply effect

const lastArg = args[args.length - 1];
const tokenDoc = await fromUuid(lastArg.tokenUuid);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const template = canvas.templates.placeables.find(i => i.data.flags?.ActiveAuras?.IsAura[0]?.data?.origin === lastArg.efData.origin);

function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

(async () => {
    if (args[0] === "on") {
        if (VolumetricTemplates) {
            const templateTargets = VolumetricTemplates.compute3Dtemplate(template);
            if (templateTargets && !templateTargets.includes(lastArg.tokenId)) {
                await wait (500);
                await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [lastArg.effectId] });
                return;
            };
        };
        const senses = tactor.data.data.attributes.senses;
        let visionRange = Math.max(senses.blindsight, senses.tremorsense, 0);
        const effectData = [{
            changes: [{ key: "ATL.flags.perfect-vision.sightLimit", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 99 - visionRange, value: `[[Math.max(@attributes.senses.blindsight, @attributes.senses.tremorsense, 0)]]`, }, ],
            origin: lastArg.uuid,
            disabled: false,
            label: "Fog Cloud Vision",
        }];
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: effectData });
    } else if (args[0] === "off") { // leaving aura vertically requires manual effect removal
        let effect = tactor.effects.find(i => i.data.label === "Fog Cloud Vision" && i.data.origin === lastArg.uuid);
        if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
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