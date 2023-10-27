// damageItems - semicolon separated
// itemArgs format - comma separated - FIRST ARG 0 = action types plus separated i.e., mwak+msak+hit (hit for attack must have damage rolled) - SECOND ARG 1 = range i.e., 5 (any for any range) - THIRD ARG = damage rollable i.e., 1d8 - FOURTH ARG = damage type i.e., fire

try {
	if (args[0].tag != "OnUse" && args[0].macroPass != "isAttacked") return;
    const damageItems = args[0].options.actor.flags["midi-qol"]?.damageOnAttacked?.trim()?.split(";");
    damageItems.forEach(async d => {
        const damageItem = d?.trim()?.split(",");
        if (damageItem?.length < 4) return;
        const actionTypes = damageItem[0]?.trim()?.split("+");
        const range = damageItem[1]?.trim() == "any" ? 9999 : isNaN(damageItem[1]?.trim()) ? null : +(damageItem[1]?.trim());
        const damageRoll = damageItem[2]?.trim();
        const damageType = damageItem[3]?.trim();
        const sourceEffect = args[0].options.actor.effects.find(e => e.changes.find(c => c.value.replace(";", "") == d));
        const itemName = sourceEffect ? sourceEffect.label : "Damage";
        const itemImg = sourceEffect ? sourceEffect.icon : "icons/svg/explosion.svg";
        if (!actionTypes || !range || !damageRoll || !damageType) return console.error("Invalid Damage On Attacked arguments:", "actor =", args[0].options.actor, "token =", args[0].options.token, "actionTypes =", actionTypes, "range =", range, "damageRoll =", damageRoll, "damageType =", damageType);
        if (!(actionTypes.includes(args[0].item.system.actionType) || (actionTypes.includes("any") && ["mwak", "rwak", "msak", "rsak"].includes(args[0].item.system.actionType))) || MidiQOL.computeDistance(args[0].workflow.token, args[0].options.token, false) > range) return console.warn("Damage On Attacked conditions not met");
        if (actionTypes.includes("hit")) {
            let hook1 = Hooks.on("midi-qol.RollComplete", async workflowNext => {
                if (workflowNext.uuid === args[0].uuid) {
                    const itemData = {
                        name: itemName,
                        img: itemImg,
                        type: "feat",
                        system: {
                            activation: { type: "special" },
                            target: { type: "self" },
                            range: { units: "self" },
                            actionType: "other",
                            damage: { parts: [[damageRoll, damageType]] }
                        },
                        flags: { autoanimations: { isEnabled: false } }
                    }
                    const item = new CONFIG.Item.documentClass(itemData, { parent: args[0].workflow.actor });
                    await MidiQOL.completeItemUse(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
                    Hooks.off("midi-qol.postActiveEffects", hook1);
                }
            });
            let hook2 = Hooks.on("midi-qol.preItemRoll", async workflowComplete => {
                if (workflowComplete.uuid === args[0].uuid) {
                    Hooks.off("midi-qol.RollComplete", hook1);
                    Hooks.off("midi-qol.preItemRoll", hook2);
                }
            });
        } else {
            const itemData = {
                name: itemName,
                img: itemImg,
                type: "feat",
                system: {
                    activation: { type: "special" },
                    target: { type: "self" },
                    range: { units: "self" },
                    actionType: "other",
                    damage: { parts: [[damageRoll, damageType]] }
                },
                flags: { autoanimations: { isEnabled: false } }
            }
            const item = new CONFIG.Item.documentClass(itemData, { parent: args[0].workflow.actor });
            await MidiQOL.completeItemUse(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
        }
    });
} catch (err) {console.error("Damage On Attacked Macro - ", err)}