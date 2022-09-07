const effect =  args[0].actorData.effects.find(ef=>ef.data.label === "Deflect Missiles Damage Reduction");
const change = effect.data.changes.find(change => change.key === "flags.midi-qol.DR.rwak");
const dr = Number.isNumeric(change.value) ? Number(change.value) : 0;
if (dr >= args[0].workflowOptions.damageTotal) {
	const throwBack = await Dialog.confirm({
      		title: game.i18n.localize("Return Missile"),
      		content: `<p>Throw the missile back at the attacker</p>`,
	    });
	if (!throwBack) return;
	let theItem = await fromUuid(args[0].workflowOptions.sourceAmmoUuid ?? args[0].workflowOptions.sourceItemUuid); // use the ammo if there is one otherwise the weapon
	const theItemData = duplicate(theItem.data);
	theItemData.data.range.value = 20;
	theItemData.data.range.long = 40;
	theItemData.actionType = "rwak";
	theItemData.data.consume = args[0].itemData.data.consume;
	theItemData.data.consume.amount = 1;

	const tokenOrActor = await fromUuid(args[0].actorUuid);
	const theActor = tokenOrActor.actor ?? tokenOrActor;
	let ownedItem = new CONFIG.Item.documentClass(theItemData, { parent: theActor });

	const targetTokenOrActor = await fromUuid(args[0].workflowOptions.sourceActorUuid);
	const targetActor = targetTokenOrActor.actor ?? targetTokenOrActor;
	const target = targetActor.token ?? targetActor.getActiveTokens()?.shift();

	await MidiQOL.completeItemRoll(ownedItem, {targetUuids: [target.uuid ?? target.document.uuid], workflowOptions: {notReaction: true, autoConsumeResource: "both"}});
}