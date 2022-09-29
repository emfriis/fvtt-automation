try {
    let socket;

    // useDialog, takes args title and content, returns true or false
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
            }, (args[0]?.timeout || 30) * 1000);
        });
    };

    // optionDialog; takes args title, options (an array of objects with ids, imgs, and names), and timeout; returns checked options's id
    async function optionDialog(...args) {
        return new Promise((resolve, reject) => {
            let optionsContent = "";
            (args[0].options).forEach((option) => {
                optionsContent += `<label class="radio-label">
                <input type="radio" name="option" value="${option.id}">
                <img src="${option.img}" style="border:0px; width: 50px; height:50px;">
                ${option.name}
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
            }, (args[0]?.timeout || 30) * 1000);
        });
    }

    // spellUseDialog; takes args title, actorData, and timeout; returns selected input's value, consume checkbox bool, and selected input text in array
    async function spellUseDialog(...args) {
        return new Promise((resolve, reject) => {
            let slotOptions = "";
            for (let i = 0; i < 9; i++) {
                let slot = i === 0 ? args[0].actor.data.spells?.pact : args[0].actor.data.spells[`spell${i}`];
                if (!slot?.value) continue;
                let level = slot?.level ? CONFIG.DND5E.spellLevels[slot.level] : CONFIG.DND5E.spellLevels[i];
                let label = slot?.level ? game.i18n.format('DND5E.SpellLevelSlot', {level: level, n: slot.value}) + " (Pact)" : game.i18n.format('DND5E.SpellLevelSlot', {level: level, n: slot.value});
                let value = slot?.level ? "pact" : `spell${i}`;
                if (level && label && value) slotOptions += `<option value="${value}">${label}</option>`;
            };
            let dialog = new Dialog({
                title: `${title}`,
                content: `
                <form id="spell-use-form">
                    <p>` + game.i18n.format("DND5E.AbilityUseHint", {name: `${title}`, type: "spell"}) + `</p>
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
                        callback: () => {resolve([$("option:selected").val(), $("#consume").is(":checked"), $("option:selected").text()])}
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
            }, (args[0]?.timeout || 30) * 1000);
        });
    }

    Hooks.once("socketlib.ready", () => {
        socket = socketlib.registerModule("user-socket-functions");
        socket.register("useDialog", useDialog);
        socket.register("optionDialog", optionDialog);
        socket.register("spellUseDialog", useDialog);
    });
} catch (err) {}
