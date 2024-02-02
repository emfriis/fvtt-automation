try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postDamageRoll" || args[0].item.type != "spell" || args[0].spellLevel == 0 || args[0].workflow.defaultDamageType.toLowerCase() != "healing") return;
    let bonusRoll = await new Roll('0 + '  + ' + ' + `${2 + args[0].spellLevel}`).evaluate({async: true});
    for (let i = 1; i < bonusRoll.terms.length; i++) {
        args[0].damageRoll.terms.push(bonusRoll.terms[i]);
    }
    args[0].damageRoll._formula = args[0].damageRoll._formula + ' + ' + `${2 + args[0].spellLevel}`;
    args[0].damageRoll._total = args[0].damageRoll.total + bonusRoll.total;
    await args[0].workflow.setDamageRoll(args[0].damageRoll);
} catch (err) {console.error("Disciple of Life Macro - ", err)}