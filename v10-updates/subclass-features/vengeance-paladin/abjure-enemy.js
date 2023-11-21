try {
    if (args[0].tag == "OnUse" && args[0].macroPass == "preambleComplete" && (["undead", "fiend"].find(c => args[0].targets[0].actor.system.details?.race?.toLowerCase()?.includes(c)) || ["undead", "fiend"].find(c => args[0].targets[0].actor.system.details?.type?.value?.toLowerCase()?.includes(c)))) {
        const effectData = {
            changes: [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "AbjureEnemy, preTargetSave", priority: 20 }],
            disabled: false,
            name: "Abjure Enemy Save Disadvantage",
            icon: args[0].item.img
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
    } else if (args[0].tag == "OnUse" && args[0].macroPass == "postActiveEffects" && !args[0].failedSaves.length && !args[0].targets[0].actor.system.traits.ci.value.has("frightened")) {
        const effectData = {
            changes: [{ key: "system.attributes.movement.all", mode: 0, value: "/2", priority: 20 }],
            disabled: false,
            name: "Abjure Enemy",
            icon: args[0].item.img,
            duration: { seconds: 60 },
            flags: { dae: { specialDuration: ["isDamaged"] } }
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].targets[0].actor.uuid, effects: [effectData] });
    } else if (args[0].tag == "TargetOnUse" && args[0].macroPass == "preTargetSave" && args[0].workflow.saveDetails && args[0].item.name.toLowerCase().includes("abjure enemy")) {
        args[0].workflow.saveDetails.disadvantage = true;
        await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: args[0].options.actor.uuid, effects: [args[0].options.actor.effects.find(e => e.name == "Abjure Enemy Save Disadvantage").id] });
    }
} catch (err)  {console.error("Abjure Enemy Macro - ", err)}