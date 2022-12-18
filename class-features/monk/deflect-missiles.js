// deflect missiles
// on use

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0].tag === "OnUse") {
	const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].workflowOptions.sourceItemUuid);
	if (attackWorkflow.item.data.data.actionType !== "rwak") return ui.notifications.error(`The incoming damage is not from a ranged weapon attack`);
	const item = tactor.items.find(i => i.name === "Ki");
	if (!item || !item.data.data.uses.value) return;
	const effect =  tactor.effects.find(e => e.data.label === "Deflect Missiles Damage Reduction");
	const change = effect.data.changes.find(c => c.key === "flags.midi-qol.DR.rwak");
	const dr = Number.isNumeric(change.value) ? Number(change.value) : 0;
	if (dr >= args[0].workflowOptions.damageTotal) {
		const throwBack = await Dialog.confirm({
			title: "Deflect Missiles",
			content: `<p>Throw the missile back at the attacker?</p>`,
		});
		if (!throwBack) return;
		const attackItem = await fromUuid(args[0].workflowOptions.sourceAmmoUuid ?? args[0].workflowOptions.sourceItemUuid); // use the ammo if there is one otherwise the weapon
		const attackItemData = duplicate(attackItem.data);
		attackItemData.data.range.value = 20;
		attackItemData.data.range.long = 60;
		attackItemData.actionType = "rwak";

		const newAttackItem = new CONFIG.Item.documentClass(attackItemData, { parent: tactor });

		const targetTokenOrActor = await fromUuid(args[0].workflowOptions.sourceActorUuid);
		const targetActor = targetTokenOrActor.actor ?? targetTokenOrActor;
		const target = targetActor.token ?? targetActor.getActiveTokens()?.shift();

    	item.update({"data.uses.value" : item.data.data.uses.value - 1});

		await MidiQOL.completeItemRoll(newAttackItem, {targetUuids: [target.uuid ?? target.document.uuid], workflowOptions: {notReaction: true}});
	}
}