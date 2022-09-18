// menacing attack

// macro.itemMacro.GM with args[1] being @token, on active effect
// requires DAE, Itemacro, Midi-QOL, More Hooks D&D5e, optionally CV, Levels

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const sourceToken = canvas.tokens.get(args[1]);

// canSee by tposney via midi-qol utils.js
async function canSee(tokenEntity, targetEntity) {
	//TODO - requires rewrite for v10
	//@ts-ignore
	let target = targetEntity instanceof TokenDocument ? targetEntity.object : targetEntity;
	//@ts-ignore
	let token = tokenEntity instanceof TokenDocument ? tokenEntity.object : tokenEntity;
	if (!token || !target)
		return true;
	const targetPoint = target.center;
	const visionSource = token.vision;
	if (!token.vision.active)
		return true; //TODO work out what to do with tokens with no vision
	const lightSources = canvas?.lighting?.sources;
	// Determine the array of offset points to test
	const t = Math.min(target.w, target.h) / 4;
	const offsets = t > 0 ? [[0, 0], [-t, -t], [-t, t], [t, t], [t, -t], [-t, 0], [t, 0], [0, -t], [0, t]] : [[0, 0]];
	const points = offsets.map(o => new PIXI.Point(targetPoint.x + o[0], targetPoint.y + o[1]));
	// If the point is entirely inside the buffer region, it may be hidden from view
	// if (!target._inBuffer && !points.some(p => canvas?.dimensions?.sceneRect.contains(p.x, p.y))) return false;
	// Check each point for one which provides both LOS and FOV membership
	const returnValue = points.some(p => {
		let hasLOS = false;
		let hasFOV = false;
		let requireFOV = !canvas?.lighting?.globalLight;
		if (!hasLOS || (!hasFOV && requireFOV)) { // Do we need to test for LOS?
			if (visionSource?.los?.contains(p.x, p.y)) {
				hasLOS = true;
				if (!hasFOV && requireFOV) { // Do we need to test for FOV?
					if (visionSource?.fov?.contains(p.x, p.y))
						hasFOV = true;
				}
			}
		}
		if (hasLOS && (!requireFOV || hasFOV)) { // Did we satisfy all required conditions?
			return true;
		}
		// Check light sources
		for (let source of lightSources?.values() ?? []) {
			if (!source.active)
				continue;
			//@ts-ignore
			if (source.containsPoint(p)) {
				//@ts-ignore
				if (source.data.vision)
					hasLOS = true;
				hasFOV = true;
			}
			if (hasLOS && (!requireFOV || hasFOV))
				return true;
		}
		return false;
	});
	return returnValue;
}

async function sightCheck(actorOrWorkflow, rollData) {
    if (actorOrWorkflow.actor !== tactor && actorOrWorkflow !== tactor) return;
    if (token && sourceToken) { 
        let canSeeSource = false;
        if (game.modules.get("conditional-visibility")?.active && game.modules.get("levels")?.active && _levels) { 
            canSeeSource = game.modules.get('conditional-visibility')?.api?.canSee(token, sourceToken) && _levels?.advancedLosTestVisibility(token, sourceToken);
        } else {
            canSeeSource = canSee(token, sourceToken);
        }
        if (canSeeSource) {
            if (rollData) {
                Object.assign(rollData, { disadvantage: true });
                return;
            }
            let ef = await tactor.effects.find(i => i.data === lastArg.efData);
            let newChanges = [];
            if (!ef.data.changes.find(c => c.key === "flags.midi-qol.disadvantage.attack.all")) newChanges.push({ key: "flags.midi-qol.disadvantage.attack.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 0 });
            if (!ef.data.changes.find(c => c.key === "flags.midi-qol.disadvantage.ability.check.all")) newChanges.push({ key: "flags.midi-qol.disadvantage.ability.check.all", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 0 });
            await ef.update({ changes: newChanges.concat(ef.data.changes) });
            if (newChanges) {
                newChanges = ef.data.changes.filter((c) => c.key !== "flags.midi-qol.disadvantage.attack.all" && c.key !== "flags.midi-qol.disadvantage.ability.check.all");
                ef.update({ changes: newChanges });
            }
        } 
    }
}

if (args[0] === "on") {
    if (game.modules.get("midi-qol")?.active) {
		let hookId1 = Hooks.on("midi-qol.preItemRoll", sightCheck);
		DAE.setFlag(tactor, "fearAtkHook", hookId1);
    }
    
    if (game.modules.get("more-hooks-5e")?.active) {
		let hookId2 = Hooks.on("Actor5e.preRollAbilityTest", sightCheck);
		DAE.setFlag(tactor, "fearAblHook", hookId2);

		let hookId3 = Hooks.on("Actor5e.preRollSkill", sightCheck);
		DAE.setFlag(tactor, "fearSklHook", hookId3);
    }
}

if (args[0] === "off") {
    const flag1 = await DAE.getFlag(tactor, "fearAtkHook");
	if (flag1) {
		Hooks.off("midi-qol.preItemRoll", flag1);
		await DAE.unsetFlag(tactor, "fearAtkHook");
	}
    
    const flag2 = await DAE.getFlag(tactor, "fearAblHook");
	if (flag2) {
		Hooks.off("Actor5e.preRollAbilityTest", flag2);
		await DAE.unsetFlag(tactor, "fearAblHook");
	}
    
    const flag3 = await DAE.getFlag(tactor, "fearSklHook");
	if (flag3) {
		Hooks.off("Actor5e.preRollSkill", flag3);
		await DAE.unsetFlag(tactor, "fearSklHook");
	}
}

try {

	if (args[0].tag !== "DamageBonus" || !["mwak", "rwak"].includes(args[0].itemData.data.actionType)|| args[0].hitTargetUuids.length < 1) return {};
	const tokenOrActorTarget = await fromUuid(args[0].hitTargetUuids[0]);
    const tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
	const die = tactor.data.data.scale["battle-master"]["combat-superiority-die"].slice(1);
    let dieCount = Object.values(tactor.data.data.resources).find(r => r.label === "Combat Superiority");
	
	if (die && dieCount && dieCount.value > 0) {

		let dialog = new Promise((resolve, reject) => {
			new Dialog({
			title: "Menacing Attack: Usage Configuration",
			content: `
			<form id="use-form">
				<p>` + game.i18n.format("DND5E.AbilityUseHint", {name: "Maneuvers: Menacing Attack", type: "feature"}) + `</p>
				<p>Use a Superiority Die to use Menacing Attack?</p>
				<p>(` + dieCount.value + ` Superiority Die Remaining)</p>
			</form>
			`,
			buttons: {
				one: {
					icon: '<i class="fas fa-check"></i>',
					label: "Confirm",
					callback: () => resolve(true)
				},
				two: {
					icon: '<i class="fas fa-times"></i>',
					label: "Cancel",
					callback: () => {resolve(false)}
				}
			},
			default: "two",
		    close: callBack => {resolve(false)}
			}).render(true);
		});
		maneuver = await dialog;
		
		if (!maneuver) return {};
		
		dieCount = Object.values(tactor.data.data.resources).find(r => r.label === "Combat Superiority");
		if (dieCount.value < 1) {
			ui.notifications.warn("Menacing Attack: No Superiority Die Remaining");
			return {};
		} else {
			await tactor.update({ 'data.resources.primary.value' : dieCount.value - 1 });
		}
		
        const rollData = tactor.getRollData();
        const strDC = 8 + rollData.attributes.prof + rollData.abilities.str.mod;
        const dexDC = 8 + rollData.attributes.prof + rollData.abilities.dex.mod;
        const saveDC = strDC > dexDC ? strDC : dexDC;
        const resist = ["Brave", "Fear Resilience"];
        const getResist = tactorTarget.items.find(i => resist.includes(i.name)) || tactorTarget.effects.find(i => resist.includes(i.data.label));
        const ability = "wis";
        const rollOptions = getResist ? { request: "save", targetUuid: tactorTarget.uuid, ability: ability, advantage: true } : { request: "save", targetUuid: tactorTarget.uuid, ability: ability };
        let roll = await MidiQOL.socket().executeAsGM("rollAbility", rollOptions);
        if (game.dice3d) game.dice3d.showForRoll(roll);
        if (roll.total < saveDC) {
            const item = await tactor.items.find(i => i.name.toLowerCase().includes("menacing attack"));
            let effectData = [{
                changes: [
                    { key: `macro.itemMacro.GM`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: args[0].tokenId, priority: 20 }
                ],
                origin: args[0].uuid,
                flags: {
                    "dae": { itemData: item.data, token: tactorTarget.uuid, specialDuration: ["turnEndSource"] },
                    "core": { statusId: "Frightened" }
                },
                disabled: false,
                icon: "icons/svg/terror.svg",
                label: "Frightened"
            }];
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: effectData });
        }
		
		const diceMult = args[0].isCritical ? 2: 1;
		const damageType = args[0].item.data.damage.parts[0][1];
		
		return {damageRoll: `${diceMult}${die}[${damageType}]`, flavor: "Menacing Attack"};
	}
} catch(err) {
	console.error(`${args[0].itemData.name} - maneuver macro`, err);
}