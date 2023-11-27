try {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    if (lastArg.tag == "OnUse" && lastArg.macroPass == "postActiveEffects") {
        const damageType = args[0].workflow.defaultDamageType ? args[0].workflow.defaultDamageType.toLowerCase() : "psychic";
        const itemData = {
            name: "Shadow Blade",
            img: "icons/skills/melee/strike-dagger-arcane-pink.webp",
            type: "weapon",
            system: {
                weaponType: "simpleM",
                description: { value: `This magic sword lasts until the spell ends. It counts as a simple melee weapon with which you are proficient. It deals 2d8 ${damageType} on a hit and has the finesse, light, and thrown properties (range 20/60). In addition, when you use the sword to attack a target that is in dim light or darkness, you make the attack roll with advantage.` },
                equipped: true,
                proficient: 2,
                activation: { type: "action", cost: 1 },
                range: { value: 20, long: 60, units: "ft" },
                actionType: "mwak",
                damage: { parts: [[`${Math.min(5, Math.ceil(1 + lastArg.spellLevel / 2))}d8`, damageType]] },
                properties: { mgc: true, thr: true, fin: true, lgt: true }
            }
        }
        await actor.createEmbeddedDocuments("Item", [itemData]);
    } else if (args[0] == "off") {
        const items = actor.items.filter(i => i.name == "Shadow Blade" && i.type == "weapon").map(i => i.id);
        if (items.length) await actor.deleteEmbeddedDocuments("Item", items);
    }
} catch (err)  {console.error("Shadow Blade Macro - ", err)}