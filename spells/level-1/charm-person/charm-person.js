// charm person

const lastArg = args[args.length - 1];

if (args[0].tag === "OnUse") {
	if (lastArg.targetUuids.length > 0) {
		let token = await fromUuid(lastArg.tokenUuid);
		let targetToken = await fromUuid(lastArg.targetUuids[0]);
		let targetActor = targetToken.actor ?? targetToken._actor;
		const resist = ["Fey Ancestry", "Duergar Reslience", "Charm Resilience"];
		let getResist = targetActor.items.find(i => resist.includes(i.name));
		if ((game?.combat?.current && targetToken.data.disposition != token.data.disposition && targetToken.data.disposition != "Neutral") || getResist) {
			const effectData = {
				changes: [
					{
						key: "flags.midi-qol.advantage.ability.save.all",
						mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
						value: 1,
						priority: 20,
					}
				],
				disabled: false,
				flags: { dae: { specialDuration: ["isSave"] } },
				icon: args[0].item.img,
				label: `${args[0].item.name} Save Advantage`,
			};
			await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
		}
	}
}