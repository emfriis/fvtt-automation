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

    // spellUseDialog; takes args title, spellOptions (a string containing option tags), and timeout; returns selected input's value, consume checkbox bool, and selected input text in array
    async function spellUseDialog(...args) {
        return new Promise((resolve, reject) => {
            let dialog = new Dialog({
                title: `${title}`,
                content: `
                <form id="smite-use-form">
                    <p>` + game.i18n.format("DND5E.AbilityUseHint", {name: `${title}`, type: "spell"}) + `</p>
                    <div class="form-group">
                        <label>Spell Slot Level</label>
                        <div class="form-fields">
                            <select id="slot" name="slot-level">` + options + `</select>
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

    // optionDialog; takes args title, content (a string containing content, with input tags for options), and timeout; returns checked input's value
    async function optionDialog(...args) {
        return new Promise((resolve, reject) => {
            let dialog = new Dialog({
                title: `${args[0]?.title ?? ""}`,
                content: `${args[0]?.content ?? ""}`,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirm",
                        callback: () => {resolve($("input:checked").val())} 
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

    Hooks.once("socketlib.ready", () => {
        socket = socketlib.registerModule("user-socket-functions");
        socket.register("useDialog", useDialog);
        socket.register("spellUseDialog", useDialog);
        socket.register("selectTargetDialog", optionDialog);
    });
} catch (err) {}
