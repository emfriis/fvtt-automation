// life drain

if (args[0].hitTargets.length < 1 || !["mwak"].includes(args[0].itemData.data.actionType)) return;
if (args[0].failedSaves.length < 1) return;
token = canvas.tokens.get(args[0].tokenId);
actor = token.actor;
if (!actor || !token) return;
let target = canvas.tokens.get(args[0].targets[0].id ?? args[0].targets[0]._id);
if (!target) return;
let targetActor = target.actor ?? target._actor;

const necroticTotal = args[0].damageTotal;
const necroticRes = (targetActor.data.data.traits.di?.value).includes("necrotic") ? 0 : (targetActor.data.data.traits.dr?.value).includes("necrotic") ? 0.5 : 1;
const necroticVul = (targetActor.data.data.traits.dv?.value).includes("necrotic") ? 2 : 1;
const necroticFinal = Math.floor(necroticTotal * necroticRes) * necroticVul;

if (necroticFinal > 0) {
	const effectData = {
			changes: [
				{
					key: "data.attributes.hp.max",
					mode: CONST.ACTIVE_EFFECT_MODES.ADD,
					value: -necroticFinal,
					priority: 20,
				}
			],
			disabled: false,
			flags: { dae: { specialDuration: ["longRest"] } },
			icon: args[0].item.img,
			label: `${args[0].item.name} Affliction`,
	};
	await targetActor.createEmbeddedDocuments("ActiveEffect", [effectData]);
};