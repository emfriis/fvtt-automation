try {
    if (args[0].tag !== "DamageBonus" || !args[0].damageRoll) return;
    let isCantrip = args[0].item.type === "spell" && args[0].spellLevel === 0;
    let isWeapon = args[0].item.type === "weapon" && ["mwak", "rwak"].includes(args[0].item.system.actionType);
    if (!isCantrip && !isWeapon) return;
    if (game.combat && args[0].actor.effects.find(e => e.label === "Used Blessed Strikes" && disabled == false)) return;
    let useFeat = true;
    if (game.combat) {
        let dialog = new Promise((resolve) => {
            new Dialog({
            title: "Blessed Strikes",
            content: `<p>Use Blessed Strikes?</p>`,
            buttons: {
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Confirm",
                    callback: () => resolve(true)
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel",
                    callback: () => {resolve(false)}
                }
            },
            default: "cancel",
            close: () => {resolve(false)}
            }).render(true);
        });
        useFeat = await dialog;
    }
    if (!useFeat) return;
    if (game.combat) {
        const effectData = {
            disabled: false,
            duration: { rounds: 1, seconds: 7 },
            flags: { dae: { specialDuration: ["turnStart"] } },
            label: "Used Blessed Strikes",
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    }
    if (game.combat && isCantrip && !isWeapon && args[0].item.system.actionType === "save" && !args[0].actor.flags["midi-qol"].potentCantrip) {
        let hook = Hooks.on("midi-qol.postCheckSaves", async workflowNext => {
            if (workflowNext.uuid === args[0].uuid) {
                if (workflowNext.failedSaves.size === 0) {
                    await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].actor.uuid, effects: [args[0].actor.effects.find(e => e.label === "Used Blessed Strikes").id] });
                    Hooks.off("midi-qol.postCheckSaves", hook);
                }
            }
        });
    }
    let diceMult = args[0].isCritical ? 2 : 1;
    return { damageRoll: `${diceMult}d8[radiant]`, flavor: "Blessed Strikes" };
} catch (err) {console.error("Blessed Strikes Macro - ", err); }