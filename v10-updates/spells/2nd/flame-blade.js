try {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    if (lastArg.tag == "OnUse" && lastArg.macroPass == "postActiveEffects") {
        const damageType = args[0].workflow.defaultDamageType ? args[0].workflow.defaultDamageType.toLowerCase() : "fire";
        const itemData = {
            name: "Flame Blade",
            img: "icons/magic/fire/projectile-bolt-zigzag-orange.webp",
            type: "weapon",
            system: {
                weaponType: "improv",
                description: { value: `You can use your action to make a melee spell Attack with the fiery blade. On a hit, the target takes 3d6 ${damageType} damage.` },
                equipped: true,
                proficient: 2,
                activation: { type: "action", cost: 1 },
                range: { value: 5, units: "ft" },
                actionType: "msak",
                damage: { parts: [[`${Math.floor(2 + lastArg.spellLevel / 2)}d6`, damageType]] },
                properties: { mgc: true }
            }
        }
        await actor.createEmbeddedDocuments("Item", [itemData]);
    } else if (args[0] == "off") {
        const items = actor.items.filter(i => i.name == "Flame Blade" && i.type == "weapon").map(i => i.id);
        if (items.length) await actor.deleteEmbeddedDocuments("Item", items);
    }
} catch (err)  {console.error("Flame Blade Macro - ", err)}