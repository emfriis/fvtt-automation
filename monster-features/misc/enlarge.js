// enlarge
// effect itemacro
// damage bonus

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const token = canvas.tokens.get(lastArg.tokenId);

if (args[0] === "on") {
    const originalSize = parseInt(token?.data?.width);
    const changes = [
        {
            key: "ATL.width",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 30,
            value: `${originalSize + 1}`,
        },
        {
            key: "ATL.height",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 30,
            value: `${originalSize + 1}`,
        },
    ];
    const effect = tactor.effects.find((e) => e.data.label === lastArg.efData.label);
    if (effect) await effect.update({ changes: changes.concat(effect.data.changes) });
}

if (args[0].tag === "DamageBonus" && ["mwak", "rwak"].includes(args[0].itemData.data.actionType)) {
    if (args[0].itemData?.data?.ability === ("str" || null) && !args[0].itemData?.data?.properties?.fin) {
        const weaponDamage = args[0].itemData?.data?.damage?.parts[0][0].replace("@mod", "0");
        const dice = args[0].isCritical ? weaponDamage.replace(/\d+(?=d)/g, (i) => (i * 2)) : weaponDamage;
		const damageType = args[0].itemData?.data?.damage?.parts[0][1];
		return {damageRoll: `${dice}[${damageType}]`, flavor: "Enlarge"};
    }
}