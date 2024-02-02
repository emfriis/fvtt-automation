try {
    if (args[0].tag != "DamageBonus" || args[0].item.type != "spell" || args[0].workflow.defaultDamageType.toLowerCase() != "healing") return;
    let newDamageRoll = args[0].workflow.damageRoll;
	newDamageRoll.terms.forEach(async t => {
		if (!t.faces) return;
		t.results.forEach(async r => {
			if (r.result >= t.faces) return;
			Object.assign(r, { rerolled: true, active: false });
            t.results.push({ result: t.faces, active: true, hidden: true });
            newDamageRoll._total = newDamageRoll._evaluateTotal();
		});
		await args[0].workflow.setDamageRoll(newDamageRoll);
	});
} catch (err) {console.error("Supreme Healing Macro - ", err)}