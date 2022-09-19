try {
    let socket;

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

    async function selectTargetDialog(...args) {
        return new Promise((resolve, reject) => {
            let dialog = new Dialog({
                title: `${args[0]?.title ?? ""}`,
                content: `${args[0]?.content ?? ""}`,
                buttons: {
                    one: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Confirm",
                        callback: () => {resolve($("input:checked").val())} // ? input[type='radio'][name='target']:checked
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
        socket.register("selectTargetDialog", selectTargetDialog);
    });
} catch (err) {}
