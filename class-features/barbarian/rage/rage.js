// rage

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;
const targetToken = await fromUuid(lastArg.tokenUuid);

async function cleanUp() {
	const flag = await DAE.getFlag(tactor, "rageHook");
	if (flag) {
		Hooks.off("midi-qol.RollComplete", flag);
		await DAE.unsetFlag(tactor, "rageHook");
	}
	try {
		let rage = await tactor.effects.find(i => i.data.label === "Rage");
		if (rage) await tactor.deleteEmbeddedDocuments("ActiveEffect", [rage.id]);
		let rageDamaged = await tactor.effects.find(i => i.data.label === "Rage Damaged");
		if (rageDamaged) await tactor.deleteEmbeddedDocuments("ActiveEffect", [rageDamaged.id]);
		let rageAttacked = await tactor.effects.find(i => i.data.label === "Rage Attacked");
		if (rageAttacked) await tactor.deleteEmbeddedDocuments("ActiveEffect", [rageAttacked.id]);
		let rageStart = await tactor.effects.find(i => i.data.label === "Rage Start");
		if (rageStart) await tactor.deleteEmbeddedDocuments("ActiveEffect", [rageStart.id]);
	} catch (err) {
		console.error(`rage macro`, err);
	}
}

async function damageCheck(workflow) {
    await wait(1000);
    let attackWorkflow = workflow.damageList.map((i) => ({ tokenId: i?.tokenId, hpDamage: i?.hpDamage })).filter(i => i.tokenId === lastArg.tokenId);
    let lastAttack = attackWorkflow[attackWorkflow.length - 1];
    if (lastAttack?.hpDamage > 0) {
		let rageDamaged = tactor.effects.find(i => i.data.label === "Rage Damaged");
		if (rageDamaged) await tactor.deleteEmbeddedDocuments("ActiveEffect", [rageDamaged.id]);
        const effectData = {
			changes: [
				{
					key: "flags.midi-qol.rageDamaged", 
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, 
					value: "1", 
					priority: 20
				},
			],
			origin: args[0].uuid,
			disabled: false,
			duration: {rounds: 1, startTime: game.time.worldTime},
			label: "Rage Damaged",
		};
		await tactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
    }
}

if (args[0] == "on" || args[0] == "each" && args[0].tag != "DamageBonus") {
	
	if (!tactor.effects.find(i => i.data.label == "Rage Start")) {
		const effectData = {
			changes: [
				{
					key: "flags.midi-qol.rageStart", 
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, 
					value: "1", 
					priority: 20
				},
			],
			origin: args[0].uuid,
			disabled: false,
			label: "Rage Start",
		};
		await tactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
		const effectData2 = {
			changes: [
				{
					key: "flags.midi-qol.rageAttacked", 
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, 
					value: "1", 
					priority: 20
				},
			],
			origin: args[0].uuid,
			disabled: false,
			duration: {rounds: 1, startTime: game.time.worldTime},
			label: "Rage Attacked",
		};
		await tactor.createEmbeddedDocuments("ActiveEffect", [effectData2]);	
	} else {
		if (!(tactor.effects.find(i => i.data.label == "Rage Damaged")) && !(tactor.effects.find(i => i.data.label == "Rage Attacked"))) {
			await cleanUp();
		}
	}
	let hookId = Hooks.on("midi-qol.RollComplete", damageCheck);
    DAE.setFlag(tactor, "rageHook", hookId);
}

if (args[0].tag == "DamageBonus") {
	
	if (["mwak", "rwak", "msak", "rsak"].includes(lastArg.itemData.data.actionType)) {
		let rageAttacked = tactor.effects.find(i => i.data.label === "Rage Attacked");
		if (rageAttacked) await tactor.deleteEmbeddedDocuments("ActiveEffect", [rageAttacked.id]);
		const effectData = {
			changes: [
				{
					key: "flags.midi-qol.rageAttacked", 
					mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, 
					value: "1", 
					priority: 20
				},
			],
			origin: args[0].uuid,
			disabled: false,
			duration: {rounds: 1, startTime: game.time.worldTime},
			label: "Rage Attacked",
		};
		await tactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
	}

    const levels = lastArg.rollData.classes?.barbarian?.levels ?? 0;
    if (!levels) return {};
    if (!lastArg.item) return {};
    const titem = tactor.items.get(lastArg.item._id);
    const rollMod = titem.abilityMod;
    if (rollMod !== "str" || !["mwak"].includes(lastArg.itemData.data.actionType)) return {};
    const bonus = levels < 9 ? "2" : (levels < 16 ? "3" : "4");
    return {damageRoll: bonus, flavor: "Rage Damage"};
} 

if (args[0] === "off") {
	await cleanUp();
}