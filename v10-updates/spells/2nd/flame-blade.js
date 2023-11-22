try {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    if (args[0] == "on") {
        const itemData = {
            name: "Flame Blade",
            img: "icons/magic/fire/projectile-bolt-zigzag-orange.webp",
            type: "weapon",
            system: {
                weaponType: "improv",
                description: { value: "You can use your action to make a melee spell Attack with the fiery blade. On a hit, the target takes 3d6 fire damage." },
                equipped: true,
                proficient: 2,
                activation: { type: "action", cost: 1 },
                range: { value: 5, units: "ft" },
                actionType: "msak",
                damage: { parts: [[`${Math.floor(2 + (isNaN(args[1]) ? 3 : +args[1]) / 2)}d6`, "fire"]] },
                properties: { mgc: true }
            }
        }
        await actor.createEmbeddedDocuments("Item", [itemData]);
    } else if (args[0] == "off") {
        const items = actor.items.filter(i => i.name == "Flame Blade" && i.type == "weapon").map(i => i.id);
        if (items.length) await actor.deleteEmbeddedDocuments("Item", items);
    }
} catch (err)  {console.error("Flame Blade Macro - ", err)}