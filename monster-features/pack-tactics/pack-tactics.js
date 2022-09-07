// pack tactics

if (args[0].targets.length < 1 || !["mwak", "rwak", "msak", "rsak"].includes(args[0].itemData.data.actionType) || args[0].macroPass != "preAttackRoll") return;
token = canvas.tokens.get(args[0].tokenId);
actor = token.actor ?? token._actor;
if (!actor || !token) return;
let target = canvas.tokens.get(args[0].targets[0].id ?? args[0].targets[0]._id);
if (!target) return;

let isPack = false;

let nearbyEnemy = canvas.tokens.placeables.filter(t => {
	let nearby = (
		t.actor &&
		t.actor?.uuid !== args[0].actorUuid && // not me
		t.actor?.id !== target.actor?.id && // not the target
		t.actor?.data.data.attributes?.hp?.value > 0 && // not dead or unconscious
		!(t.actor?.effects.find(i => i.data.label === "Incapacitated")) && // not incapacitated
		t.data.disposition === token.data.disposition && // an ally
		MidiQOL.getDistance(t, target, false) <= 5 // close to the target
	);
	return nearby;
});
isPack = nearbyEnemy.length > 0;

if (isPack) {
	const effectData = {
		changes: [
			{
				key: "flags.midi-qol.advantage.attack.all",
				mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
				value: 1,
				priority: 20,
			}
		],
		disabled: false,
		flags: { dae: { specialDuration: ["1Attack"] } },
		icon: args[0].item.img,
		label: `${args[0].item.name} Advantage`,
	};
	await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
};