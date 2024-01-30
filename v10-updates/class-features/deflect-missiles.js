// VERY WIP
try {
	const effect =  args[0].actorData.effects.find(ef=>ef.label === "Deflect Missiles Damage Reduction");
	const change = effect.changes.find(change => change.key === "flags.midi-qol.DR.rwak");
	const dr = (await new Roll(change.value, actor.getRollData()).evaluate({async: true})).total;
	if (dr >= args[0].workflowOptions.damageTotal) {
		const throwBack = await Dialog.confirm({
				title: game.i18n.localize("Return Missile"),
				content: `<p>Throw the missile back at the attacker</p>`,
			});
		if (!throwBack) return;
		let attackItem = await fromUuid(args[0].workflowOptions.sourceAmmoUuid ?? args[0].workflowOptions.sourceItemUuid);
		const attackItemData = attackItem.toObject();
		attackItemData.system.range.value = 20;
		attackItemData.system.range.long = 60;
		attackItemData.actionType = "rwak";
		attackItemData.system.consume = args[0].itemData.system.consume;

		const tokenOrActor = await fromUuid(args[0].actorUuid);
		const theActor = tokenOrActor.actor ?? tokenOrActor;
		let ownedItem = new CONFIG.Item.documentClass(attackItemData, { parent: theActor });

		const targetTokenOrActor = await fromUuid(args[0].workflowOptions.sourceActorUuid);
		const targetActor = targetTokenOrActor.actor ?? targetTokenOrActor;
		const target = targetActor.token ?? targetActor.getActiveTokens()?.shift();
		await MidiQOL.completeItemRoll(ownedItem, {targetUuids: [target.uuid ?? target.document.uuid], workflowOptions: {notReaction: true, autoConsumeResource: "both"}});
	}
} catch (err) {console.error("Deflect Missiles Macro - ", err)}