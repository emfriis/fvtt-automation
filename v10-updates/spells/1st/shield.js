try {
    if (args[0].macroPass == "preTargetDamageApplication" && workflow.item.name.includes("Magic Missile")) args[0].workflow.damageItem.hpDamage = 0;
} catch (err)  {console.error("Shield Macro - ", err)}