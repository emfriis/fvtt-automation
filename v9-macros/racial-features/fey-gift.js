// fey gift
// on use

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (!tactor || !lastArg.targetUuids || lastArg.targetUuids.length === 0) return;

const tokenOrActorTarget = await fromUuid(lastArg.targetUuids[0]);
const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;

if (lastArg.macroPass === "preambleComplete") {
    if (!tactorTarget || token.data.disposition === -lastArg.targets[0].data.disposition || lastArg.tokenUuid === lastArg.targetUuids[0]) return;

    let dialog1 = new Promise(async (resolve, reject) => {
        new Dialog({
            title: `Help Action`,
            content: `Help with check or attack?`,
            buttons: {
                Check: {
                    label: "Check",
                    callback: () => {resolve("check")}
                },
                Attack: {
                    label: "Attack",
                    callback: () => {resolve("attack")}
                }
            },
            default: "Attack"
        }).render(true);
    });
    let helpType = await dialog1;

    if (!helpType) return;
    if (helpType === "check") {
        const effectData = {
            changes: [
                { key: `flags.midi-qol.advantage.ability.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 },
                { key: `flags.midi-qol.advantage.skill.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 },
            ],
            origin: lastArg.uuid,
            flags: {
                "dae": { specialDuration: ["isCheck","isSkill"] },
                "core": { statusId: "Help" },
            },
            disabled: false,
            label: "Help",
            icon: "icons/svg/upgrade.svg"
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
    } else if (helpType === "attack") {
        let helpDialog =  new Promise(async (resolve, reject) => {
            new Dialog({
                title: "Helpn",
                content: `<p>Target a creature to help against.</p>`,
                buttons: {
                    Ok: {
                        label: "Ok",
                        callback: () => { resolve(Array.from(game.user?.targets)[0] ?? false) },
                    },
                },
                default: "Ok",
                close: () => { resolve(false) },
            }).render(true);
        });
        let helpTarget = await helpDialog;
        if (!helpTarget) return;
        if (MidiQOL.getDistance(token, helpTarget, false) > (tactor.data.flags["midi-qol"].masterOfTactics ? 30 : 5)) {
            ui.notifications.warn("Target is not within 5 feet");
            return;
        }

        const effectData = {
            changes: [
                { key: `flags.midi-qol.onUseMacroName`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Help, preAttackRoll", priority: 20 },
                { key: `flags.midi-qol.help`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `+${helpTarget.id}`, priority: 20 },
            ],
            origin: lastArg.uuid,
            flags: { "core": { statusId: "Help" }, },
            disabled: false,
            label: "Help",
            icon: "icons/svg/upgrade.svg"
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
    }

    if (tactor.data.data.details.level < 3) return;

    let dialog2 = new Promise(async (resolve, reject) => {
        new Dialog({
            title: `Fey Gift`,
            content: `Help with check or attack?`,
            buttons: {
                Hospitality: {
                    label: "Hospitality",
                    callback: () => {resolve("hospitality")}
                },
                Passage: {
                    label: "Passage",
                    callback: () => {resolve("passage")}
                },
                Spite: {
                    label: "Spite",
                    callback: () => {resolve("spite")}
                },
            },
            default: "Hospitality"
        }).render(true);
    });
    let giftType = await dialog2;

    if (giftType === "hospitality") {
        const roll = await new Roll(`1d6`).evaluate({ async: false });
        if (game.dice3d) game.dice3d.showForRoll(roll);
        await USF.socket.executeAsGM("updateActor", { actorUuid: tactor.uuid, updates: {"data.attributes.hp.temp" : Math.max(tactor.data.data.attributes.hp.temp, roll.total) } });
        await USF.socket.executeAsGM("updateActor", { actorUuid: tactorTarget.uuid, updates: {"data.attributes.hp.temp" : Math.max(tactor.data.data.attributes.hp.temp, roll.total) } });
    } else if (giftType === "passage") {
        const effectData = {
            changes: [{ key: `data.attributes.movement.walk`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: "+10", priority: 20 }],
            origin: lastArg.uuid,
            flags: { "core": { statusId: "Fey Gift: Passage" }, "dae": { specialDuration: ["turnStartSource"] } },
            disabled: false,
            label: "Fey Gift: Passage",
            icon: "systems/dnd5e/icons/skills/yellow_28.jpg"
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
    } else if (giftType === "spite") {
        const effectData = {
            changes: [{ key: `flags.midi-qol.feyGiftSpite`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 }],
            origin: lastArg.uuid,
            flags: { "core": { statusId: "Fey Gift: Spite" }, "dae": { specialDuration: ["turnStartSource"] } },
            disabled: false,
            label: "Fey Gift: Spite",
            icon: "systems/dnd5e/icons/skills/yellow_28.jpg"
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
    }
}
