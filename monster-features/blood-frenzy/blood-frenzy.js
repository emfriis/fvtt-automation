// blood frenzy

if (args[0].targets.length < 1 || !["mwak", "rwak", "msak", "rsak"].includes(args[0].itemData.data.actionType) || args[0].macroPass != "preAttackRoll") return;
token = canvas.tokens.get(args[0].tokenId);
actor = token.actor;
if (!actor || !token) return;
let target = canvas.tokens.get(args[0].targets[0].id ?? args[0].targets[0]._id);
if (!target) return;

if (target.actor.data.data.attributes.hp.value < target.actor.data.data.attributes.hp.max) {
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