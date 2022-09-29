// fey presence

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const sourceToken = canvas.tokens.get(args[1]);
const sourceActor = sourceToken?.actor ?? sourceToken?._actor;

if (args[0].tag === "OnUse" && args[0].macroPass === "preItemRoll") {
	let dialog = new Promise(async (resolve, reject) => {
        let errorMessage;
        new Dialog({
            title: `${item.name}`,
            content: `Apply Charmed or Frightened?`,
            buttons: {
				charmed: {
					label: "Charmed",
					callback: () => {resolve(true)}
				},
				frightened: {
					label: "Frightened",
					callback: () => {resolve(false)}
				}
			},
            close: async (html) => {
                if(errorMessage) reject(new Error(errorMessage));
            },
            default: "charmed"
        }).render(true);
    });
    let efCharmed = await dialog;
	if (efCharmed) {
		let effectData = {
            label: "Fey Presence Charm",
            icon: "icons/magic/unholy/orb-hands-pink.webp",
            origin: lastArg.uuid,
            flags: { dae: { specialDuration: ["turnEnd"] }}, 
            disabled: false
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
	} else {
		let effectData = {
            label: "Fey Presence Frighten",
            icon: "icons/magic/unholy/orb-hands-pink.webp",
            origin: lastArg.uuid,
            flags: { dae: { specialDuration: ["turnEnd"] }}, 
            disabled: false
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
	}
}

if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0 && args[0].macroPass === "preSave") {
	if (tactor.effects.find(e => e.data.label === "Fey Presence Frighten")) {
		const resist = ["Brave", "Fear Resilience"];
		for (let i = 0; i < lastArg.targetUuids.length; i++) {
			let tokenOrActorTarget = await fromUuid(lastArg.targetUuids[i]);
			let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
			let getResist = tactorTarget.items.find(i => resist.includes(i.name));
			if (getResist) {
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
				await tactorTarget.createEmbeddedDocuments("ActiveEffect", [effectData]);
			}
		}
	} else if (tactor.effects.find(e => e.data.label === "Fey Presence Charm")) {
		if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0 && args[0].macroPass === "preSave") {
			const resist = ["Fey Ancestry", "Duergar Reslience", "Charm Resilience"];
			for (let i = 0; i < lastArg.targetUuids.length; i++) {
				let tokenOrActorTarget = await fromUuid(lastArg.targetUuids[i]);
				let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
				let getResist = tactorTarget.items.find(i => resist.includes(i.name));
				if (getResist) {
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
					await tactorTarget.createEmbeddedDocuments("ActiveEffect", [effectData]);
				}
			}
		}
	}
}

if (args[0] === "on") {
	let fear = sourceActor.effects.find(i => i.data.label === "Fey Presence Frighten");
	let charm = sourceActor.effects.find(i => i.data.label === "Fey Presence Charm");
	if (fear) {
		let ef = tactor.effects.find(i => i.data === lastArg.efData);
		if (ef) ef.update({ label: "Frightened", icon: "icons/svg/terror.svg", flags: { core: { statusId: "Frightened" } } });
	} else if (charm) {
		let ef = tactor.effects.find(i => i.data === lastArg.efData);
		const changes = [
			{
				key: "StatusEffect",
				mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
				priority: 0,
				value: "Convenient Effect: Charmed"
			},
			{
				key: "flags.midi-qol.charm",
				mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
				priority: 0,
				value: `${args[1]}`
			}
		]
		if (ef) ef.update({ label: "Charmed", icon: "modules/dfreds-convenient-effects/images/charmed.svg", flags: { core: { statusId: "Convenient Effect: Charmed" } }, changes: changes });
	}
}