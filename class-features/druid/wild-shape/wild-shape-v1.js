// wild shape
// on use
// requires "Beasts" folder in actors dir

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

try {
    if (args[0].tag === "OnUse") {

        const actorData = tactor.getRollData();
        const classLevel = actorData.details.cr ?? actorData.classes.druid.levels;
        let druidCR = classLevel > 7 ? 1 : classLevel > 3 ? 0.5 : 0.25;
        const maxFly = classLevel > 7 ? 9999 : 0;
        const maxSwim = classLevel > 3 ? 9999 : 0;
        const circleForms = tactor.items.find(i => i.name === "Circle Forms");
        const primalStrike = tactor.items.find(i => i.name === "Primal Strike");
        if (circleForms) druidCR = classLevel > 5 ? Math.floor(classLevel / 3) : 1;

        const folderName = "Beasts";
        const getFolder = game.folders.getName(folderName).content;
        const filteredFolder = getFolder.filter((i) => i.data.data.details.cr <= druidCR && i.data.data?.details?.type?.value.toLowerCase() == "beast" && i.data.data.attributes.movement.fly <= maxFly && i.data.data.attributes.movement.swim <= maxSwim);
        const folderContents = filteredFolder.reduce((acc, target) => acc += `<option value="${target.id}">${target.name} CR: ${target.data.data.details.cr}</option>`, ``);
        const content = `<p>Pick a beast</p><form><div class="form-group"><label for="beast">Beast:</label><select id="beast">${folderContents}</select></div></form>`;
        const keepItems = tactor.items.filter(i => i.data.type === "feat" && !["blind sight", "darkvision", "tremorsense", "true sight"].includes(i.name.toLowerCase()) && i.name !== "Wild Shape").map(i => i.data);
        const removeEffects = tactor.effects.filter(e => ["blind sight", "darkvision", "tremorsense", "true sight"].includes(e.data.label.toLowerCase())).map(e => e.id);
        new Dialog({
            title: "Wild Shape",
            content: content,
            buttons: {
                change: {
                    label: "Change", callback: async (html) => {
                        
                        // get polymorph target
                        let polyId = html.find('#beast')[0].value;
                        let findToken = getFolder.find(i => i.id === polyId);
                        const getToken = duplicate(token.data);

                        // transform
                        await tactor.transformInto(findToken, { keepBio: true, keepClass: true, keepMental: true, mergeSaves: true, mergeSkills: true, transformTokens: true });
                        let findPoly = await game.actors.find(i => i.name === `${tactor.name} (${findToken.name})`);
                        await canvas.scene.updateEmbeddedDocuments("Token", [{ "_id": getToken._id, "displayBars": CONST.TOKEN_DISPLAY_MODES.ALWAYS, "mirrorX": getToken.mirrorX, "mirrorY": getToken.mirrorY, "rotation": getToken.rotation, "elevation": getToken.elevation }]);

                        // primal strike
                        if (primalStrike) {
                            let weapons = findPoly.items.filter((i) => i.data.type === "weapon");
                            weapons.forEach((weapon) => { weapon.update({ "data.properties.mgc": true }) });
                        }

                        // revert wild shape
                        let wildShapeRevert = [{
                            "name": "Wild Shape (Revert)",
                            "type": "feat",
                            "img": "icons/creatures/mammals/elk-moose-marked-green.webp",
                            "data": {
                                "description": { "value": "<p class=\"compendium-hr\">Starting at 2nd level, you can use your action to magically assume the shape of a beast that you have seen before. You can use this feature twice. You regain expended uses when you finish a short or long rest.</p>" },
                                "activation": { "type": "bonus", "cost": 1 },
                                "target": { "type": "self" },
                                "actionType": "util",
                                "requirements": "Druid 2"
                            },
                            "flags": {
                                "itemacro": {
                                    "macro": {
                                        "data": {
                                            "_id": null,
                                            "name": "Wild Shape (Revert)",
                                            "type": "script",
                                            "scope": "global",
                                            "command": "const tokenOrActor = await fromUuid(args[0].actorUuid);\nconst tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;\nawait tactor.deleteEmbeddedDocuments(`ActiveEffect`, [tactor.effects.find(e => e.data.label === `Wild Shape`).id]);",
                                        }
                                    }
                                },
                                "midi-qol": {
                                    "onUseMacroName": "[postActiveEffects]ItemMacro",
                                    "effectActivation": false
                                }
                            }
                        }];
                        await findPoly.createEmbeddedDocuments("Item", wildShapeRevert);

                        // update spells
                        let keys = Object.keys(tactor.data.data.spells);
                        let spellUpdates = keys.reduce((acc, values, i) => {
                            acc[`data.spells.${values}.value`] = Object.values(tactor.data.data.spells)[i].value;
                            acc[`data.spells.${values}.max`] = Object.values(tactor.data.data.spells)[i].max;
                            return acc;
                        }, {});
                        await findPoly.update(spellUpdates);

                        // create class/racial/other feat items
                        await findPoly.createEmbeddedDocuments("Item", keepItems);
                        
                        // remove existing vision effects
                        await findPoly.deleteEmbeddedDocuments("ActiveEffect", removeEffects);

                        // remove duplicate effects
                        findPoly.effects.forEach(async effect => {
                            if (findPoly.effects.find(e => e.uuid !== effect.uuid && e.data.label === effect.data.label && !e.data.origin.includes(findPoly.uuid))) await findPoly.deleteEmbeddedDocuments("ActiveEffect", [effect.id]); 
                        });

                        // reload vision effects
                        const visionEffects = findPoly.effects.filter(e => ["blind sight", "darkvision", "tremorsense", "true sight"].some(v => e.data.label.toLowerCase().includes(v)));
                        await findPoly.deleteEmbeddedDocuments("ActiveEffect", visionEffects.map(e => e.id));
                        await findPoly.createEmbeddedDocuments("ActiveEffect", visionEffects.map(e => e.data));

                        // create removal effect
                        const effectData = {
                            label: "Wild Shape",
                            icon: "icons/creatures/mammals/elk-moose-marked-green.webp",
                            changes: [
                                { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: ``, priority: 20 },
                            ],
                            origin: item.uuid,
                            disabled: false,
                            duration: { seconds: Math.floor(classLevel / 2) * 3600, startTime: game.time.worldTime },
                            flags: { "dae": { itemData: lastArg.item, token: tactor.uuid, } },
                        }
                        await findPoly.createEmbeddedDocuments("ActiveEffect", [effectData]);

                        // set wild shape flags
                        await findPoly.setFlag("midi-qol", "wildShape", tactor.uuid);
                        await findPoly.setFlag("midi-qol", "wildShapeEffects", findPoly.effects.filter(e => !e.data?.flags?.ActiveAuras?.applied).map(e => e.id));
                    }
                }
            },
            default: "change"
        }).render(true);

    } else if (args[0] === "off") {

        // get transformation data
        let wildShape = tactor.getFlag("midi-qol", "wildShape");
        let wildShapeEffectsIds = tactor.getFlag("midi-qol", "wildShapeEffects");
        let newEffectsData = tactor.effects.filter(e => !wildShapeEffectsIds.includes(e.id) && !(e.data.label === "Unconscious" && !e.data.origin)).map(e => e.data);
        const concFlag = tactor.data.flags["midi-qol"]["concentration-data"];
        // get spells data
        let keys = Object.keys(tactor.data.data.spells);
        let spellUpdates = keys.reduce((acc, values, i) => {
            acc[`data.spells.${values}.value`] = Object.values(tactor.data.data.spells)[i].value;
            acc[`data.spells.${values}.max`] = Object.values(tactor.data.data.spells)[i].max;
            return acc;
        }, {});

        // get feat item uses data
        let featUses = tactor.items.filter(i => i.data.data.uses?.max).map(i => ({ uses: i.data.data.uses, name: i.name }));

        // revert transformation
        if (tactor.isPolymorphed) await tactor.revertOriginalForm();

        // get original actor
        const ogTokenOrActor = await fromUuid(wildShape);
        const ogTactor = ogTokenOrActor.actor ? ogTokenOrActor.actor : ogTokenOrActor;

        // add new effects
        let oldEffectsOrigins = ogTactor.effects.map(e => e.data.origin);
        newEffectsData.forEach(async effectData => {
            if (oldEffectsOrigins.includes(effectData.origin)) return;
            await Object.assign(effectData?.document?.parent, ogTactor);
            await ogTactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        });
        
        // remove outdated auras
        ogTactor.effects.forEach(async effect => {
            console.warn(effect.data?.flags?.ActiveAura?.applied)
            if (effect.data?.flags?.ActiveAuras?.applied && !newEffectsData.find(d => d.origin === effect.data.origin)) await ogTactor.deleteEmbeddedDocuments("ActiveEffect", [effect.id]);
        });
        
        // update concentration
        if (concFlag) await ogTactor.setFlag("midi-qol", "concentration-data", concFlag);

        // update spells
        await ogTactor.update(spellUpdates);

        // update feat item uses
        ogTactor.items.forEach(async item => {
            let match = featUses.find(f => f.name === item.name);
            if (match) {
                await item.update({ "data.uses": match.uses });
            }  
        });

        // reload vision effects
        const visionEffects = ogTactor.effects.filter(e => ["blind sight", "darkvision", "tremorsense", "true sight"].some(v => e.data.label.toLowerCase().includes(v)));
        await ogTactor.deleteEmbeddedDocuments("ActiveEffect", visionEffects.map(e => e.id));
        await ogTactor.createEmbeddedDocuments("ActiveEffect", visionEffects.map(e => e.data));

    }
} catch (err) {
    console.error("Wild Shape macro error", err);
}