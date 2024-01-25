try {
    const lastArg = args[args.length - 1];
    let newHp = getProperty(lastArg.updates, "system.attributes.hp.value");
    let oldHp = lastArg.targetActor.system.attributes.hp.value;
    if (newHp && newHp < oldHp) {
        await ChatMessage.create({content: `${lastArg.originItem.name} does ${oldHp - newHp} damage to ${lastArg.sourceActor.name}`});
        MidiQOL.applyTokenDamage([{damage: oldHp - newHp, type: "none"}], oldHp - newHp, new Set([lastArg.sourceToken]), undefined, new Set(), { existingDamage: [], superSavers: new Set(), semiSuperSavers: new Set(), workflow: undefined, updateContext: {onUpdateCalled: true} })
    }
} catch (err) {console.error("Warding Bond Macro - ", err)}