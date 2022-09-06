// shadow of moil

const lastArg = args[args.length - 1];
const token = await fromUuid(lastArg.tokenUuid);
const targetToken = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

async function cleanUp() {
	const flag = await DAE.getFlag(tactor, "somHook");
	if (flag) {
		Hooks.off("midi-qol.preDamageRoll", flag);
		await DAE.unsetFlag(tactor, "somHook");
	}
}

async function applyDamage(target) {
  const item = await fromUuid(lastArg.efData.origin);

  const caster = item.parent;
  const casterToken = canvas.tokens.placeables.find((t) => t.actor?.uuid === caster.uuid);
  const damageRoll = await new Roll(`2d8[necrotic]`).evaluate({ async: true });
  if (game.dice3d) game.dice3d.showForRoll(damageRoll);
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
  // console.warn("workflowItemData", workflowItemData);

  await new MidiQOL.DamageOnlyWorkflow(
    caster,
    casterToken.data,
    damageRoll.total,
    "necrotic",
    [target],
    damageRoll,
    {
      flavor: `(${CONFIG.DND5E.damageTypes["necrotic"]})`,
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
		if ((lastArg.tokenUuid) in (workflow.hitDisplayData) && workflow.hitDisplayData[`${lastArg.tokenUuid}`].hitString == "hits" && MidiQOL.getDistance(targetToken, attackerToken, false) <= 10 && ["rwak", "rsak", "mwak", "msak"].includes(workflow.item.data.data.actionType)) {
			applyDamage(attacker);
		}
	}
}

if (args[0] == "on") {
	let hookId = Hooks.on("midi-qol.preDamageRoll", hitCheck);
    DAE.setFlag(tactor, "somHook", hookId);
}

if (args[0] == "off") {
	await cleanUp();
}