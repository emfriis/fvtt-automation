try {
    if (args[0].tag === "OnUse" && args[0].macroPass === "preItemRoll") {
        Hooks.once("dnd5e.preUseItem", (item, config, options) => {
            options.configureDialog = false;
            return true;
        });
        Hooks.once("dnd5e.preItemUsageConsumption", (item, config, options) => {
            config.consumeUsage = false;
            return true;
        });
    } else if (args[0].tag === "OnUse" && args[0].macroPass === "postDamageRoll") {
        let target = args[0].hitTargets[0].actor;
        let usesItem = args[0].actor.items.find(i => i.name === "Lay on Hands" && i.system.uses?.value);
        let uses = usesItem.system.uses.value;
        if (!target || !uses || ["undead", "fiend"].some(t => target.system.details?.type?.value?.toLowerCase()?.includes(t)) || ["undead", "fiend"].some(t => target.system.details?.type?.value?.toLowerCase()?.includes(t))) return;
        let heal = await new Promise((resolve) => {
            new Dialog({
                title: "Lay on Hands",
                content: `
                <form id="use-form">
                    <p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Lay on Hands", type: "feature"}) + `</p>
                    <div class="form-group">
                        <label>Healing (${uses} Points Remaining)</label>
                        <div class="form-fields">
                            <input id="heal" name="heal" type="number" min="1" max="${uses}"></input>
                        </div>
                    </div>
                </form>
                `,
                buttons: {
                    heal: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Heal",
                        callback: () => {
                            if (uses >= $('#heal')[0].value) {
                                resolve({ type: "heal", value: $('#heal')[0].value });
                            } else {
                                ui.notifications.warn("Not enough Points of Healing Remaining"); 
                            }
                        }
                    },
                    cure: {
                        icon: '<i class="fas fa-check"></i>',
                        label: "Cure",
                        callback: () => {  
                            if (uses >= 5) {
                                resolve({ type: "cure", value: 5 });
                            } else {
                                ui.notifications.warn("Not enough Points of Healing Remaining"); 
                            }
                        }
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
        if (!heal || !heal.type || !heal.value) return;
        if (heal.type === "heal") {
            let newDamageFormula = `${heal.value}`;
            args[0].workflow.damageRoll = await new Roll(newDamageFormula).roll();
            args[0].workflow.damageTotal = args[0].workflow.damageRoll.total;
            args[0].workflow.damageRollHTML = await args[0].workflow.damageRoll.render();
            usesItem.update({"system.uses.value": uses - heal.value});
        } else if (heal.type === "cure") {
            let hook = Hooks.on("midi-qol.RollComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].workflow.uuid) {
                    let chatMessage = await game.messages.get(args[0].itemCardId);
                    let content = duplicate(chatMessage.content);
                    let newContent = content.replace("Healing", "Cure").replace(/<div class="midi-qol-saves-display">[\s\S]*<div class="end-midi-qol-saves-display">/g, `Target is cured of one disease or poison.`);
                    chatMessage.update({content: newContent});
                    Hooks.off("midi-qol.RollComplete", hook);
                }
            });
            usesItem.update({"system.uses.value": uses - 5});
        }
    }
} catch (err)  {console.error("Lay on Hands Macro - ", err); }