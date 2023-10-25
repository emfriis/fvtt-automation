try {
	const lastArg = args[args.length - 1];
	const tokenOrActor = await fromUuid(lastArg.actorUuid);
	const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
	if (args[0] !== "each" || actor.flags["midi-qol"]?.viralAuraImmunity?.includes(args[2] ? args[2] : "all") || actor.system.traits.ci.value.has("poisoned")) return;
	const itemData = {
        name: "Viral Aura",
        img: "icons/magic/acid/dissolve-bone-ribs-skull.webp",
        type: "feat",
        system: {
            activation: { type: "special" },
            target: { type: "self" },
            range: { units: "self" },
            actionType: "save",
            save: { ability: "con", dc: isNaN(args[1]) ? 10 : args[1], scaling: "flat" },
        },
        effects: [{ 
            changes: [{ key: "system.traits.di.value", mode: 0, value: "healing", priority: 20 }, { key: "macro.CE", mode: 0, value: "Poisoned", priority: 20 }], 
            disabled: false,
            transfer: false,
            isSuppressed: false, 
            icon: "icons/magic/acid/dissolve-bone-ribs-skull.webp", 
            name: "Viral Aura", 
            duration: { rounds: 1, turns: 1, seconds: 7 },
			flags: { dae: { specialDuration: ["turnEnd"] } }	
        }]
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: actor });
    const workflow = await MidiQOL.completeItemRolUse(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
	if (workflow.failedSaves.size) return;
	const effectData = {
        label: "Viral Aura Immunity",
		changes: [{ key: "flags.midi-qol.viralAuraImmunity", mode: 2, value: args[2] ? args[2] : "all", priority: 20 }], 
        disabled: false,
		duration: { seconds: 86400 }
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [effectData] });
} catch (err)  {console.error("Viral Aura Macro - ", err)}
