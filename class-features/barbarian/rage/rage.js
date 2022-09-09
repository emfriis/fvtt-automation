// rage

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;
const targetToken = await fromUuid(lastArg.tokenUuid);
const actorData = tactor.getRollData();
const levels = actorData.classes?.barbarian?.levels ?? 0;

async function cleanUp(removeEf) {
	wait(1000);
	const flag = await DAE.getFlag(tactor, "rageHook");
	if (flag) {
		Hooks.off("midi-qol.RollComplete", flag);
		await DAE.unsetFlag(tactor, "rageHook");
	}
	try {
		if (removeEf) {
			let rage = tactor.effects.find(i => i.data.label === "Rage");
			if (rage) await tactor.deleteEmbeddedDocuments("ActiveEffect", [rage.id]);
		} else {
			let rageDamaged = tactor.effects.find(i => i.data.label === "Rage Damaged");
			if (rageDamaged) await tactor.deleteEmbeddedDocuments("ActiveEffect", [rageDamaged.id]);
			let rageAttacked = tactor.effects.find(i => i.data.label === "Rage Attacked");
			if (rageAttacked) await tactor.deleteEmbeddedDocuments("ActiveEffect", [rageAttacked.id]);
		}
	} catch (err) {
		console.error(`rage macro`, err);
	}
}

async function endRage(hp, damage) {
	let relentlessDC = Number(getProperty(tactor.data.flags, "midi-qol.relentlessDC") ?? 10);
	if (levels >= 11 && relentlessDC && hp < 1 && damage - tactor.data.data.attributes.hp.value < tactor.data.data.attributes.hp.max) {
		let dialog = new Promise((resolve, reject) => {
			new Dialog({
				title: "Relentless Rage: Use Feature?",
				buttons: {
					Ok: {
						label: "Ok",
						callback: () => {resolve(true)},
					},
					Cancel: {
						label: "Cancel",
						callback: () => {resolve(false)},
					},
				},
				default: "Cancel",
				close: () => {resolve(false)}
			}).render(true);
		});
		let doSave = await dialog;

		if (doSave) {
			const rollOptions = { chatMessage: true, fastForward: true };
			const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: "save", targetUuid: tactor.uuid, ability: "con", options: rollOptions });

			let relentlessEf = tactor.effects.find(i => i.data.label === "Relentless Rage DC");
			if (relentlessEf) await tactor.deleteEmbeddedDocuments("ActiveEffect", [relentlessEf.id]);
			const effectData2 = {
				changes: [
					{
						key: "flags.midi-qol.relentlessDC", 
						mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, 
						value: `${relentlessDC + 5}`, 
						priority: 20
					},
				],
				origin: args[0].uuid,
				disabled: false,
				flags: { dae: { specialDuration: ["shortRest", "longRest"] } },
				label: "Relentless Rage DC",
			};
			await tactor.createEmbeddedDocuments("ActiveEffect", [effectData2]);

			if (roll.total >= relentlessDC) {
				tactor.update({"data.attributes.hp.value": 1});
				let uncon = tactor.effects.find(i => i.data.label === "Unconscious");
				if (uncon) await actor.deleteEmbeddedDocuments("ActiveEffect", [uncon.id]);
			} else {
				cleanUp(true);
			}
		}
	} else {
		if (tactor.effects.find(i => i.data.label === "Unconscious") || tactor.data.data.attributes.hp.value < 1) {
			cleanUp(true);
		}
	}
}

async function damageCheck(workflow) {
	if (workflow?.damageList) {
		let attackWorkflow = workflow?.damageList.map((i) => ({ tokenId: i?.tokenId, hpDamage: i?.hpDamage, newHP: i?.newHP })).filter(i => i.tokenId === lastArg.tokenId);
		if (!attackWorkflow) return;
		let lastAttack = attackWorkflow[attackWorkflow.length - 1];
		if (lastAttack?.hpDamage > 0) {
			if (levels < 15) {
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
					duration: {rounds: 1, turns: 1, startTime: game.time.worldTime},
					label: "Rage Damaged",
				};
				await tactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
			}

			await endRage(lastAttack?.newHP, lastAttack?.hpDamage);
		}
	}
}

if (args[0] == "on") {
	if (levels < 15) {
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

	let hookId = Hooks.on("midi-qol.RollComplete", damageCheck);
    DAE.setFlag(tactor, "rageHook", hookId);
}

if (args[0] === "each" && levels < 15) {
	if (!(tactor.effects.find(i => i.data.label == "Rage Damaged")) && !(tactor.effects.find(i => i.data.label == "Rage Attacked"))) {
		await cleanUp(true);
	}
}

if (args[0].tag === "OnUse" && args[0].macroPass === "preAttackRoll" && levels < 15) {
	if (["mwak", "rwak", "msak", "rsak"].includes(lastArg.itemData.data.actionType)) {
		let rageAttacked = await tactor.effects.find(i => i.data.label === "Rage Attacked");
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
			duration: {rounds: 1, turns: 1, startTime: game.time.worldTime},
			label: "Rage Attacked",
		};
		await tactor.createEmbeddedDocuments("ActiveEffect", [effectData]);
	}
}

if (args[0].tag == "DamageBonus") {
    if (!lastArg.item) return {};
    const titem = tactor.items.get(lastArg.item._id);
    const rollMod = titem.abilityMod;
    if (rollMod !== "str" || !["mwak"].includes(lastArg.itemData.data.actionType)) return {};
    const bonus = levels < 9 ? "2" : (levels < 16 ? "3" : "4");
    return {damageRoll: bonus, flavor: "Rage Damage"};
} 

if (args[0] === "off") {
	await cleanUp(false);
}