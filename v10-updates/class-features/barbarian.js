//rage

try {
    if (args[0].tag === "DamageBonus" && args[0].damageRoll && args[0].item.system.actionType === "mwak" && ["str", "", null].includes(args[0].item.system.ability)) return { damageRoll: `${args[0].actor.system.scale?.barbarian?.["rage-damage"] ?? 2}`, flavor: "Rage" };
} catch (err) {console.error("Rage Macro - ", err)}

//reckless attack

try {
    if (args[0].tag === "OnUse" && args[0].macroPass === "preAttackRoll" && args[0].item.system.actionType === "mwak" && ["str", "", null].includes(args[0].item.system.ability)) args[0].workflow.advantage = true;
} catch (err) {console.error("Reckless Attack Macro - ", err)}

//danger sense

try {
    if (args[0].tag === "TargetOnUse" && args[0].macroPass === "preTargetSave" && args[0].workflow.item && args[0].workflow.saveDetails && args[0].workflow.item.system?.save?.ability === "dex" && !checkIncapacitated(args[0].actor)) args[0].workflow.saveDetails.advantage = true;
} catch (err) {console.error("Danger Sense Macro - ", err)}