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
        const combatWildShape = tactor.items.find(i => i.name === "Combat Wild Shape");
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
                        await wait(2000);
                        let findPoly = await game.actors.find(i => i.name === `${tactor.name} (${findToken.name})`);
                        await canvas.scene.updateEmbeddedDocuments("Token", [{ "_id": getToken._id, "displayBars": CONST.TOKEN_DISPLAY_MODES.ALWAYS, "mirrorX": getToken.mirrorX, "mirrorY": getToken.mirrorY, "rotation": getToken.rotation, "elevation": getToken.elevation }]);
                        
                        // primal strike
                        if (primalStrike) {
                            let weapons = findPoly.items.filter((i) => i.data.type === "weapon");
                            weapons.forEach((weapon) => { weapon.update({ "data.properties.mgc": true }) });
                        }

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

                        // reload vision effects
                        const visionEffects = findPoly.effects.filter(e => ["blind sight", "darkvision", "tremorsense", "true sight"].some(v => e.data.label.toLowerCase().includes(v)));
                        await findPoly.deleteEmbeddedDocuments("ActiveEffect", visionEffects.map(e => e.id));
                        await findPoly.createEmbeddedDocuments("ActiveEffect", visionEffects.map(e => e.data));
                        
                        // remove duplicate effects
                        findPoly.effects.forEach(async effect => {
                            if (findPoly.effects.find(e => e.uuid !== effect.uuid && e.data.label === effect.data.label && e.data.origin.includes(tactor.uuid))) await findPoly.deleteEmbeddedDocuments("ActiveEffect", [effect.id]); 
                        });

                        // create removal effect
                        const effectData = {
                            label: "Wild Shape",
                            icon: "icons/creatures/mammals/elk-moose-marked-green.webp",
                            changes: [
                                { key: `flags.midi-qol.wildShape`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: tactor.uuid, priority: 20 },
                                { key: `macro.itemMacro`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: ``, priority: 20 },
                            ],
                            origin: item.uuid,
                            disabled: false,
                            duration: { seconds: classLevel * 3600, startTime: game.time.worldTime },
                            flags: { "dae": { itemData: lastArg.item, token: tactor.uuid, } },
                        }
                        await findPoly.createEmbeddedDocuments("ActiveEffect", [effectData]);
                    }
                }
            },
            default: "change"
        }).render(true);
    } else if (args[0] === "off") {

        // get concentration data
        const concData = tactor.effects.find(e => e.data.label === "Concentrating")?.data;
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
        await wait(500);

        const ogTokenOrActor = await fromUuid(lastArg.efData.flags.dae.token);
        const ogTactor = ogTokenOrActor.actor ? ogTokenOrActor.actor : ogTokenOrActor;

        // update concentration
        const conc = tactor.data.effects.find(e => e.data.label === "Concentrating");
        if (concData) {
            if (!conc) await ogTactor.createEmbeddedDocuments("ActiveEffect", [concData]);
            if (concFlag) await ogTactor.setFlag("midi-qol", "concentration-data", concFlag);
        } else {
            if (conc) await ogTactor.deleteEmbeddedDocuments("ActiveEffect", [conc.id]);
        }

        // update spells
        await ogTactor.update(spellUpdates);

        // update feat item uses
        ogTactor.items.forEach(async item => {
            let match = featUses.find(f => f.name === item.name)
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