try {
	const lastArg = args[args.length - 1];
	const tokenOrActor = await fromUuid(lastArg.actorUuid);
	const actor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
	if (args[0] !== "each" || actor.flags["midi-qol"]?.stenchImmunity?.includes(args[2] ? args[2] : "all") || actor.system.traits.ci.value.has("poisoned")) return;
	const itemData = {
        name: "Stench",
        img: "icons/commodities/tech/smoke-bomb-purple.webp",
        type: "feat",
        system: {
            activation: { type: "special" },
            target: { type: "self" },
            range: { units: "self" },
            actionType: "save",
            save: { ability: "con", dc: isNaN(args[1]) ? 10 : args[1], scaling: "flat" },
        },
        effects: [{ 
            changes: [{ key: "macro.CE", mode: 0, value: "Poisoned", priority: 20 }], 
            disabled: false,
            transfer: false,
            isSuppressed: false, 
            icon: "icons/commodities/tech/smoke-bomb-purple.webp", 
            name: "Stench", 
            duration: { rounds: 1, seconds: 7 },
			flags: { dae: { specialDuration: ["turnStart"] } }	
        }],
        flags: { autoanimations: { isEnabled: false } }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: actor });
    const workflow = await MidiQOL.completeItemUse(item, { showFullCard: false, createWorkflow: true, configureDialog: false });
	if (workflow.failedSaves.size) return;
	const effectData = {
        label: "Stench Immunity",
		changes: [{ key: "flags.midi-qol.stenchImmunity", mode: 2, value: args[2] ? args[2] : "all", priority: 20 }], 
        disabled: false,
		flags: { dae: { specialDuration: ["longRest"] } }
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: actor.uuid, effects: [effectData] });
} catch (err)  {console.error("Stench Macro - ", err)}
