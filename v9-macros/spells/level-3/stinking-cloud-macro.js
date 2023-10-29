// stinking cloud
// macro.execute - StinkingCloud
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
                await wait (100);
                await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [lastArg.effectId] });
                return;
            };
        };
        const senses = tactor.data.data.attributes.senses;
        let visionRange = Math.max(senses.blindsight, senses.tremorsense, 0);
        const effectData = [{
            changes: [{ key: "ATL.flags.perfect-vision.sightLimit", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, priority: 99 - visionRange, value: `${visionRange}` }],
            origin: lastArg.uuid,
            disabled: false,
            label: "Stinking Cloud Vision",
        }];
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: effectData });
    } else if (args[0] === "off") { // leaving aura vertically requires manual effect removal
        let effect = tactor.effects.find(i => i.data.label === "Stinking Cloud Vision" && i.data.origin === lastArg.uuid);
        if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: tactor.uuid, effects: [effect.id] });
    };
})();

if (args[0] === "each" && !tactor.data.data.traits.ci.value.includes("poisoned")) {
    const itemData = {
        name: `${lastArg.efData.label} Save`,
        img: lastArg.efData.icon,
        type: "feat",
        flags: {
            midiProperties: { magiceffect: true, spelleffect: true, }
        },
        data: {
            activation: { type: "none", },
            target: { type: "self", },
            actionType: "save",
            save: { dc: args[1], ability: "con", scaling: "flat" },
        }
    }
    await tactor.createEmbeddedDocuments("Item", [itemData]);
    let saveItem = await tactor.items.find(i => i.name === itemData.name);
    let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
    await tactor.deleteEmbeddedDocuments("Item", [saveItem.id]);
    if (saveWorkflow.failedSaves.size) ChatMessage.create({ content: `The Creature is afflicted by the Stinking Cloud and wastes its action.` });
}

/*
// Stinking Cloud
// macro.execute - StinkingCloud
// aura - all, check height, apply effect

if (!game.modules.get("ActiveAuras")?.active) {
    ui.notifications.error("ActiveAuras is not enabled");
    return;
};
  
if (args[0].tag === "OnUse" && args[0].macroPass === "preActiveEffects") {
    return await AAhelpers.applyTemplate(args);
};
*/