try {
    let socket;

    // updateActor
    async function updateActor(...args) {
        return new Promise(async (resolve, reject) => {
            const tokenOrActor = await fromUuid(args[0]?.actorUuid);
            const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
            await tactor.update(args[0]?.updates);
            resolve(true); 
        });
    }

    // transformActor
    async function transformActor (...args) {
        return new Promise(async (resolve, reject) => {
            const tokenOrActor = await fromUuid(args[0]?.actorUuid);
            const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
            const folderContents = game.folders.getName(args[0]?.folderName).content;
            const transformTarget = folderContents.find(i => i.id === args[0]?.transformId);
            await tactor.transformInto(transformTarget, args[0]?.transformOptions);
            resolve(true); 
        });
    }

    // revertTransformActor
    async function revertTransformActor (...args) {
        return new Promise(async (resolve, reject) => {
            const tokenOrActor = await fromUuid(args[0]?.actorUuid);
            const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
            if (tactor.isPolymorphed) { 
                await tactor.revertOriginalForm();
                game.actors.forEach(a => {
                    if (a.uuid === tactor.uuid) a.delete();
                });
            }
            resolve(true); 
        });
    }

    // createItem
    async function createItem(...args) {
        return new Promise(async (resolve, reject) => {
            const tokenOrActor = await fromUuid(args[0]?.actorUuid);
            const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
            await tactor.createEmbeddedDocuments("Item", [args[0]?.itemData]);
            resolve(true); 
        });
    }

    // updateItem
    async function updateItem(...args) {
        return new Promise(async (resolve, reject) => {
            const item = await fromUuid(args[0]?.itemUuid);
            await item.update(args[0]?.updates);
            resolve(true); 
        });
    }

    // deleteItem
    async function deleteItem(...args) {
        return new Promise(async (resolve, reject) => {
            const item = await fromUuid(args[0]?.itemUuid);
            await item.parent.deleteEmbeddedDocuments("Item", [item.id]);
            resolve(true); 
        });
    }

    // attemptSaveDC
    async function attemptSaveDC(...args) {
        return new Promise(async (resolve, reject) => {
            const tokenOrActor = await fromUuid(args[0]?.actorUuid);
            const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
            const itemData = {
                name: args[0]?.saveName ?? "Save",
                img: args[0]?.saveImg ?? "icons/svg/shield.svg",
                type: "feat",
                flags: {
                    midiProperties: { magiceffect: args[0]?.magiceffect, spelleffect: args[0]?.spelleffect, }
                },
                data: {
                    activation: { type: "none", },
                    target: { type: "self", },
                    actionType: args[0]?.saveType,
                    save: { dc: args[0]?.saveDC, ability: args[0]?.saveAbility, scaling: "flat" },
                }
            }
            await tactor.createEmbeddedDocuments("Item", [itemData]);
            let saveItem = await tactor.items.find(i => i.name === itemData.name);
            let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
            await tactor.deleteEmbeddedDocuments("Item", [saveItem.id]);
            resolve(saveWorkflow.failedSaves.size ? false : true); 
        });
    }

    // midiItemRoll, takes args itemUuid, and options; returns workflow data
    async function midiItemRoll(...args) {
        return new Promise(async (resolve, reject) => {
            const item = await fromUuid(args[0]?.itemUuid);
            const workflow = await MidiQOL.completeItemRoll(item, args[0]?.options);
            resolve({ itemLevel: workflow?.itemLevel, countered: workflow?.countered }); // cant return actual workflow
        });
    }

    // useDialog, takes args title, content, and timeout (optional); returns true or false
    async function useDialog(...args) {
        return new Promise((resolve, reject) => {
            let dialog = new Dialog({
                title: `${args[0]?.title ?? ""}`,
                content: `<p>${args[0]?.content ?? ""}</p>`,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirm",
                        callback: () => {resolve(true)}
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => {resolve(false)}
                    }
                },
                default: "two",
                close: callBack => {resolve(false)}
            }).render(true);
            let timeoutId = setTimeout(() => {
                dialog.close();
                resolve(false);
            }, (args[0]?.timeout ?? 60) * 1000);
        });
    }

    // optionDialog; takes args title, options (an array of objects with ids, imgs, and names), and timeout (optional); returns checked options's id
    async function optionDialog(...args) {
        return new Promise((resolve, reject) => {
            let optionsContent = "";
            (args[0].options).forEach((option) => {
                optionsContent += `<label class="radio-label">
                <input type="radio" name="option" value="${option.id ?? option.data.id}">
                <img src="${option.img ?? option.data.img}" style="border:0px; width: 100px; height:100px;">
                ${option.name ?? option.data.name}
                </label>`;
            });
            let content = `
                <style>
                .option .form-group {
                    display: flex;
                    flex-wrap: wrap;
                    width: 100%;
                    align-items: flex-start;
                }

                .option .radio-label {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                    justify-items: center;
                    flex: 1 0 25%;
                    line-height: normal;
                }

                .option .radio-label input {
                    display: none;
                }

                .option img {
                    border: 0px;
                    width: 50px;
                    height: 50px;
                    flex: 0 0 50px;
                    cursor: pointer;
                }

                /* CHECKED STYLES */
                .option [type=radio]:checked + img {
                    outline: 2px solid #f00;
                }
                </style>
                <form class="option">
                <div class="form-group" id="options">
                    ${optionsContent}
                </div>
                </form>
            `;
            let dialog = new Dialog({
                title: `${args[0]?.title ?? ""}`,
                content: `${content ?? ""}`,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirm",
                        callback: () => {resolve($("input[type='radio'][name='option']:checked").val())} 
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => {resolve(false)}
                    }
                },
                default: "two",
                close: callBack => {resolve(false)}
            }).render(true);
            let timeoutId = setTimeout(() => {
                dialog.close();
                resolve(false);
            }, (args[0]?.timeout ?? 60) * 1000);
        });
    }

    // spellUseDialog; takes args title, actorData, minLevel (optional), and timeout (optional); returns selected option id, value, and consume checkbox bool in array
    async function spellUseDialog(...args) {
        return new Promise((resolve, reject) => {
            let slotOptions = "";
            for (let i = 0; i < 9; i++) {
                let slot = i === 0 ? args[0]?.actorData.data.spells?.pact : args[0].actorData.data.spells[`spell${i}`];
                let minLevel = args[0]?.minLevel ?? 1;
                if (!slot?.value) continue;
                if ((i === 0 && slot?.level < minLevel) || (i > 0 && i < minLevel)) continue;
                let level = slot?.level ? slot.level : i;
                let label = slot?.level ? game.i18n.format('DND5E.SpellLevelSlot', {level: CONFIG.DND5E.spellLevels[level], n: slot.value}) + " (Pact)" : game.i18n.format('DND5E.SpellLevelSlot', {level: CONFIG.DND5E.spellLevels[level], n: slot.value});
                let value = slot?.level ? "pact" : `spell${i}`;
                if (level && label && value) slotOptions += `<option id="${level}" value="${value}">${label}</option>`;
            };
            let dialog = new Dialog({
                title: `${args[0]?.title}`,
                content: `
                <form id="spell-use-form">
                    <p>` + game.i18n.format("DND5E.AbilityUseHint", {name: `${args[0]?.title}`, type: "spell"}) + `</p>
                    <div class="form-group">
                        <label>Spell Slot Level</label>
                        <div class="form-fields">
                            <select id="slot" name="slot-level">` + slotOptions + `</select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="checkbox">
                        <input id="consume" type="checkbox" name="consumeCheckbox" checked/>` + game.i18n.localize("DND5E.SpellCastConsume") + `</label>
                    </div>
                </form>
                `,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirm",
                        callback: () => {resolve({ level: $("#slot").find(":selected").attr("id"), type: $("#slot").find(":selected").val(), consume: $("#consume").is(":checked")})}
                    },
                    two: {
                        icon: '<i class="fas fa-times"></i>',
                        label: "Cancel",
                        callback: () => {resolve(false)}
                    }
                },
                default: "two",
                close: () => {resolve(false)}
            }).render(true);
            let timeoutId = setTimeout(() => {
                dialog.close();
                resolve(false);
            }, (args[0]?.timeout ?? 60) * 1000);
        });
    }

    Hooks.once("socketlib.ready", () => {
        socket = globalThis.socketlib.registerModule("user-socket-functions");
        socket.register("updateActor", updateActor);
        socket.register("transformActor", transformActor);
        socket.register("revertTransformActor", revertTransformActor);
        socket.register("createItem", createItem);
        socket.register("updateItem", updateItem);
        socket.register("deleteItem", deleteItem);
        socket.register("attemptSaveDC", attemptSaveDC);
        socket.register("midiItemRoll", midiItemRoll);
        socket.register("useDialog", useDialog);
        socket.register("optionDialog", optionDialog);
        socket.register("spellUseDialog", spellUseDialog);
    });

    Hooks.once('ready', () => {
        globalThis.USF = { socket: socketlib.registerModule("user-socket-functions") }
    });
} catch (err) {}
