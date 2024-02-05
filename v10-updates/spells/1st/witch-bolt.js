try {
    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
    if (lastArg.tag == "OnUse" && lastArg.macroPass == "postActiveEffects") {
        const damageType = args[0].workflow.defaultDamageType ? args[0].workflow.defaultDamageType.toLowerCase() : "lightning";
        const itemData = {
            name: "Reactivate Witch Bolt",
            img: "icons/magic/lightning/bolt-blue.webp",
            type: "feat",
            system: {
                description: { value: "You can use your action to deal 1d12 lightning damage to the target automatically. The spell ends if you use your action to do anything else. The spell also ends if the target is ever outside the spell's range or if it has total cover from you." },
                activation: { type: "action", cost: 1 },
                range: { value: 30, units: "ft" },
                actionType: "other",
                damage: { parts: [["1d12", damageType]] },
            },
            flags: { midiProperties: { magicdam: true, magiceffect: true }, "midi-qol": { itemCondition: `MidiQOL.computeDistance(workflow.token,[...workflow.targets][0],false)<=30&&[...workflow.targets][0].actor?.effects?.find(e=>e.name.includes('Witch Bolt Tether')&&e.origin.includes('${args[0].actor.uuid}'))` } }
        }
        await actor.createEmbeddedDocuments("Item", [itemData]);
    } else if (args[0] == "off") {
        const items = actor.items.filter(i => i.name == "Reactivate Witch Bolt" && i.type == "feat").map(i => i.id);
        if (items.length) await actor.deleteEmbeddedDocuments("Item", items);
    }
} catch (err)  {console.error("Witch Bolt Macro - ", err)}