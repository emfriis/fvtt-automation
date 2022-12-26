// polymorph
// on use post saves
// effect itemacro
// requires "Beasts" folder in actors dir

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

if (args[0].tag === "OnUse" && lastArg.failedSaves.length !== 0) {
    const tokenTarget = lastArg.failedSaves[0];
    const tokenOrActorTarget = await fromUuid(lastArg.failedSaveUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;

    const isCharacter = tactorTarget.data.type === "character";
    const polyCR = actor.data.data.details.cr ?? tactor.data.data.details.level;
    const folderName = "Beasts";
    const getFolder = game.folders.getName(folderName).content;
    const filteredFolder = getFolder.filter((i) => i.data.data.details.cr <= polyCR && i.data.data?.details?.type?.value.toLowerCase() == "beast");
    const folderContents = filteredFolder.reduce((acc, target) => acc += `<option value="${target.id}">${target.name} CR: ${target.data.data.details.cr}</option>`, ``);
    const content = `<p>Pick a beast</p><form><div class="form-group"><label for="beast">Beast:</label><select id="beast">${folderContents}</select></div></form>`;
    const removeVisionEffects = tactor.effects.filter(e => ["blind sight", "darkvision", "tremorsense", "true sight"].some(v => e.data.label.toLowerCase().includes(v))).map(e => e.id);

    new Dialog({
        title: "Polymorph: Choose a Beast",
        content,
        buttons: {
            Ok: {
                label: "Ok",
                callback: async (html) => {
                    // get polymorph target
                    let polyId = html.find('#beast')[0].value;
                    let findToken = getFolder.find(i => i.id === polyId);
                    const getToken = duplicate(tokenTarget.data);

                    // transform
                    let polyOptions = { keepBio: true, keepClass: false, keepMental: false, mergeSaves: false, mergeSkills: false, transformTokens: true }
                    await USF.socket.executeAsGM("transformActor", { actorUuid: tactorTarget.uuid, folderName: folderName, transformId: polyId, transformOptions: polyOptions });

                    // post transform config
                    await wait(100);
                    let findPoly;
                    if (isCharacter) { 
                        findPoly = await game.actors.find(i => i.name === `${tactorTarget.name} (${findToken.name})`);
                    } else {
                        findPoly = tactorTarget;
                        await findPoly.setFlag("midi-qol", "polymorphTokenData", getToken);
                    }
                    await canvas.scene.updateEmbeddedDocuments("Token", [{ "_id": getToken._id, "displayBars": CONST.TOKEN_DISPLAY_MODES.ALWAYS, "mirrorX": getToken.mirrorX, "mirrorY": getToken.mirrorY, "rotation": getToken.rotation, "elevation": getToken.elevation }]);
                    await findPoly.setFlag("midi-qol", "polymorph", tactorTarget.uuid);
                    await findPoly.setFlag("midi-qol", "polymorphEffects", findToken.effects.map(e => e.data.label));

                    // create removal effect
                    const conc = tactor.effects.find(e => e.data.label === "Concentrating");
                    const gameRound = game.combat ? game.combat.round : 0;
                    const durationType = lastArg.item.data.duration.units;
                    const duration = durationType === "second" ? lastArg.item.data.duration.value * 6 : durationType === "minute" ? lastArg.item.data.duration.value * 10 : durationType === "hour" ? lastArg.item.data.duration.value * 600 : lastArg.item.data.duration.value;
                    const effectData = {
                        label: lastArg.item.name,
                        icon: lastArg.item.img,
                        changes: [
                            { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: ``, priority: 20 },
                        ],
                        origin: lastArg.uuid,
                        disabled: false,
                        duration: { rounds: duration, startRound: gameRound, startTime: game.time.worldTime },
                        flags: { "dae": { itemData: lastArg.item, token: tactorTarget.uuid, } },
                    }
                    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
                    if (conc) {
                        let concUpdate = await getProperty(tactor.data.flags, "midi-qol.concentration-data.targets");
                        await concUpdate.push({ tokenUuid: tokenOrActorTarget.uuid, actorUuid: tactorTarget.uuid });
                        await tactor.setFlag("midi-qol", "concentration-data.targets", concUpdate);
                    }

                    // reload vision effects
                    await wait(100);
                    const visionEffects = findPoly.effects.filter(e => ["blind sight", "darkvision", "tremorsense", "true sight"].some(v => e.data.label.toLowerCase().includes(v)));
                    await findPoly.deleteEmbeddedDocuments("ActiveEffect", visionEffects.filter(e => !removeVisionEffects.includes(e.id)).map(e => e.id));
                    await findPoly.createEmbeddedDocuments("ActiveEffect", visionEffects.filter(e => !removeVisionEffects.includes(e.id)).map(e => e.data));
                },
            },
            Cancel: {
                label: "Cancel",
            },
        },
        default: "Cancel",
    }).render(true);
}

if (args[0] === "off") {
    const isCharacter = tactor.data.type === "character";

    // get transformation data
    let polymorph = tactor.getFlag("midi-qol", "polymorph");
    let polymorphEffects = tactor.getFlag("midi-qol", "polymorphEffects");
    let newEffects = tactor.effects.filter(e => !polymorphEffects?.includes(e.data.label) && !["blind sight", "darkvision", "tremorsense", "true sight"].some(v => e.data.label.toLowerCase().includes(v)) && !(e.data.label === "Unconscious" && !e.data.origin)).map(e => e.data);
    const concFlag = tactor.data.flags["midi-qol"]["concentration-data"];

    // get original actor
    let ogTactor;
    if (isCharacter) {
        await USF.socket.executeAsGM("revertTransformActor", { actorUuid: tactor.uuid });
        let ogTokenOrActor = await fromUuid(polymorph);
        ogTactor = ogTokenOrActor.actor ? ogTokenOrActor.actor : ogTokenOrActor;
    } else {
        let polymorphTokenData = tactor.getFlag("midi-qol", "polymorphTokenData");
        tactor.unsetFlag("midi-qol", "polymorphTokenData");
        const getToken = duplicate(token.data);
        Object.assign(polymorphTokenData, { "_id": getToken._id, "mirrorX": getToken.mirrorX, "mirrorY": getToken.mirrorY, "rotation": getToken.rotation, "elevation": getToken.elevation, "x": getToken.x, "y": getToken.y });
        await canvas.scene.updateEmbeddedDocuments("Token", [polymorphTokenData]);
        ogTactor = tactor;
    }

    // add new effects
    let conditions = ["Blinded", "Charmed", "Deafened", "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", "Restrained", "Stunned", "Unconscious"];
    newEffects.forEach(async effectData => {
        if (ogTactor.effects.find(e => e.data.label === effectData.label) && !conditions.includes(effectData.label)) return;
        await Object.assign(effectData?.document?.parent, ogTactor);
        await ogTactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    });
    
    // remove outdated effects
    ogTactor.effects.forEach(async effect => {
        if (["blind sight", "darkvision", "tremorsense", "true sight"].some(v => effect.data.label.toLowerCase().includes(v))) return;
        if (!newEffects.find(e => e.data.label === effect.data.label)) await ogTactor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
    });
    
    // update concentration
    if (concFlag) await ogTactor.setFlag("midi-qol", "concentration-data", concFlag);

    // reload vision effects
    await wait(100);
    const visionEffects = ogTactor.effects.filter(e => ["blind sight", "darkvision", "tremorsense", "true sight"].some(v => e.data.label.toLowerCase().includes(v)));
    await ogTactor.deleteEmbeddedDocuments("ActiveEffect", visionEffects.map(e => e.id));
    await ogTactor.createEmbeddedDocuments("ActiveEffect", visionEffects.map(e => e.data));
}