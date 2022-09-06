// armor of agathys
// requires MIDI-QOL, DAE
// will not remove effect if damage is dealt without a midi-qol workflow

const lastArg = args[args.length - 1];
const token = await fromUuid(lastArg.tokenUuid);
const targetToken = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;
const tempDmg = args[1] * 5;

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

async function cleanUp(removeTemp, removeEf) {
	const flag1 = await DAE.getFlag(tactor, "aoaHook");
	if (flag1) {
		Hooks.off("midi-qol.preDamageRoll", flag1);
		await DAE.unsetFlag(tactor, "aoaHook");
	}
	const flag2 = await DAE.getFlag(tactor, "tempHook");
	if (flag2) {
		Hooks.off("midi-qol.RollComplete", flag2);
		await DAE.unsetFlag(tactor, "tempHook");
	}
	if (removeTemp) {
		await tactor.update({ "data.attributes.hp.temp": 0 });
	}
	if (removeEf) {
		let aoa = tactor.effects.find(i => i.data.label === "Armor of Agathys");
		if (aoa) await tactor.deleteEmbeddedDocuments("ActiveEffect", [aoa.id]);
	}
}

async function applyDamage(target) {
  const item = await fromUuid(lastArg.efData.origin);

  const caster = item.parent;
  const casterToken = canvas.tokens.placeables.find((t) => t.actor?.uuid === caster.uuid);
  const damageRoll = await new Roll(`${tempDmg}[cold]`).evaluate({ async: true });
  const workflowItemData = duplicate(item.data);
  workflowItemData.data.components.concentration = false;
  workflowItemData.data.duration = { value: null, units: "inst" };
  workflowItemData.data.target = { value: null, width: null, units: "", type: "creature" };

  setProperty(workflowItemData, "flags.itemacro", {});
  setProperty(workflowItemData, "flags.midi-qol", {});
  setProperty(workflowItemData, "flags.dae", {});
  setProperty(workflowItemData, "effects", []);
  delete workflowItemData._id;
  workflowItemData.name = `${workflowItemData.name}`;

  await new MidiQOL.DamageOnlyWorkflow(
    caster,
    casterToken.data,
    damageRoll.total,
    "cold",
    [target],
    damageRoll,
    {
      flavor: `(${CONFIG.DND5E.damageTypes["cold"]})`,
      itemCardId: "new",
      itemData: workflowItemData,
      isCritical: false,
    }
  );
}

async function hitCheck(workflow) {
    await wait(500);
	if (lastArg.tokenUuid != workflow.tokenUuid) {
		let attacker = await fromUuid(workflow.tokenUuid);
		let attackerToken = canvas.tokens.get(workflow.tokenId);
		if ((lastArg.tokenUuid) in (workflow.hitDisplayData) && workflow.hitDisplayData[`${lastArg.tokenUuid}`].hitString == "hits" && ["mwak", "msak"].includes(workflow.item.data.data.actionType)) {
			applyDamage(attacker);
		}
	}
}

async function damageCheck(workflow) {
    await wait(500);
	if (workflow.damageList?.length > 0) {
		let attackWorkflow = workflow.damageList.map((i) => ({ tokenUuid: i?.tokenUuid, oldTempHP: i?.oldTempHP, newTempHP: i?.newTempHP })).filter(i => i.tokenUuid === lastArg.tokenUuid);
		let lastDmg = attackWorkflow[attackWorkflow.length - 1];
		if (lastDmg.newTempHP < 1) {
			cleanUp(false, true);
		} else if (lastDmg.newTempHP > lastDmg.oldTempHP && lastDmg.oldTempHP != 0) {
			if (workflow.item.data.name == "Armor of Agathys") {
				cleanUp(false, false);
			} else {
				cleanUp(false, true);
			}
		}
	}
}

if (args[0] == "on") {
	if (tactor.data.data.attributes.hp.temp == 0) {
		await tactor.update({ "data.attributes.hp.temp": tempDmg });
	}
	let hookId1 = Hooks.on("midi-qol.preDamageRoll", hitCheck);
    DAE.setFlag(tactor, "aoaHook", hookId1);
	let hookId2 = Hooks.on("midi-qol.RollComplete", damageCheck);
    DAE.setFlag(tactor, "tempHook", hookId2);
}

if (args[0] == "off") {
	const flag = await DAE.getFlag(tactor, "aoaHook");
	if (flag) {
		await cleanUp(true, false);
	}
}