async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const token = await fromUuid(lastArg.tokenUuid);
const tactor = token.actor ? token.actor : token;

let size = tactor.data.data.traits.size;
let hp = tactor.data.data.attributes.hp.value;
if (size === "sm" || hp < 10) {
    ui.notifications.warn("Ooze to small to split");
    return;
};
let workflowOptions = lastArg.workflowOptions;
let useSplit = false;
for (let i = 0; i < workflowOptions.damageDetail.length; i++) {
    if (workflowOptions.damageDetail[i].type.toLowerCase() === "slashing" || workflowOptions.damageDetail[i].type.toLowerCase() === "lightning") {
        useSplit = true;
    } else {
        hp -= tactor.data.data.traits.di?.value.includes(workflowOptions.damageDetail[i].type.toLowerCase()) ? 0 : tactor.data.data.traits.dr?.value.includes(workflowOptions.damageDetail[i].type.toLowerCase()) ? Math.ceil(workflowOptions.damageDetail[i].damage / 2) : tactor.data.data.traits.dv?.value.includes(workflowOptions.damageDetail[i].type.toLowerCase()) ? workflowOptions.damageDetail[i].damage * 2 : workflowOptions.damageDetail[i].damage;
    }
};
if (!useSplit) {
    ui.notifications.warn("No slashing or lightning damage taken");
    return;
};
let newSize = size === "grg" ? "huge" : size === "huge" ? "lg" : size === "lg" ? "med" : "sm";
let newScale = newSize === "sm" ? token.data.scale * 0.75 : token.data.scale;
let newHeight = Math.max(1, token.data.height - 1);
let newWidth = Math.max(1, token.data.width - 1);
let updates = {
    token: { "height": Math.max(1, token.data.height - 1), "width": Math.max(1, token.data.width - 1) },
    actor: { "data.attributes.hp.max": Math.floor(hp / 2), "data.attributes.hp.value": Math.floor(hp / 2), "data.traits.size": newSize },
};
let effectData = {
    label: "Split Size",
    origin: lastArg.uuid,
    disabled: false,
    changes: [
        {
            key: "ATL.width",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 99 - newWidth,
            value: newWidth,
        },
        {
            key: "ATL.height",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 99 - newWidth,
            value: newHeight,
        },
        {
            key: "ATL.scale",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 99 - newWidth,
            value: newScale,
        },
    ]
};
await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
await warpgate.spawnAt({ x: token.data.x, y: token.data.y}, token.data, updates, { permanent: true });
await warpgate.spawnAt({ x: token.data.x, y: token.data.y}, token.data, updates, { permanent: true });
await token.delete();