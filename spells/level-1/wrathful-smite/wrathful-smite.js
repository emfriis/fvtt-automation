// wrathful smite

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const sourceToken = canvas.tokens.get(args[1]);
const gameRound = game.combat ? game.combat.round : 0;

async function attemptRemoval(targetToken, condition, item) {
    if (game.dfreds.effectInterface.hasEffectApplied(condition, targetToken.uuid)) {
        new Dialog({
        title: `Use action to attempt to remove ${condition}?`,
        buttons: {
            one: {
            label: "Yes",
            callback: async () => {
                const caster = item.parent;
                const saveDc = caster.data.data.attributes.spelldc;
                const removalCheck = true;
                const ability = "wis";
                const type = removalCheck ? "abil" : "save";
                const rollOptions = { chatMessage: true, fastForward: true };
                const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: type, targetUuid: targetToken.uuid, ability: ability, options: rollOptions });
                if (game.dice3d) game.dice3d.showForRoll(roll);

                if (roll.total >= saveDc) {
                    let fear = tactor.effects.find(i => i.data === lastArg.efData);
		            if (fear) await tactor.deleteEmbeddedDocuments("ActiveEffect", [fear.id]);
                } else {
                    if (roll.total < saveDc) ChatMessage.create({ content: `${targetToken.name} fails the roll for ${item.name}, still has the ${condition} condition.` });
                }
            },
            },
            two: {
            label: "No",
            callback: () => {},
            },
        },
        }).render(true);
    }
}

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

if (lastArg.tag === "OnUse") {
    let itemD = lastArg.item;
    let itemName = game.i18n.localize(itemD.name);
    let effectData = [{
        changes: [
            { key: "flags.dnd5e.DamageBonusMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `ItemMacro.${itemName}`, priority: 20 },
            { key: "flags.midi-qol.spellId", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: lastArg.uuid, priority: 20 }
        ],
        origin: lastArg.uuid,
        disabled: false,
        duration: { rounds: 10, startRound: gameRound, startTime: game.time.worldTime },
        flags: {
            "dae": { itemData: itemD, specialDuration: ["1Hit"] }
        },
        icon: itemD.img,
        label: itemName
    }];
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: token.actor.uuid, effects: effectData });
}

if (lastArg.tag === "DamageBonus") {
    if (!["mwak"].includes(lastArg.item.data.actionType) || lastArg.hitTargetUuids.length < 1) return {};
    let tokenOrActorTarget = await fromUuid(lastArg.hitTargetUuids[0]);
    let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
    let spellDC = tactor.data.data.attributes.spelldc;
    let conc = tactor.effects.find(i => i.data.label === game.i18n.localize("Concentrating"));
    let spellUuid = getProperty(tactor.data.flags, "midi-qol.spellId");
    let spellItem = await fromUuid(getProperty(tactor.data.flags, "midi-qol.spellId"));
    let itemName = game.i18n.localize(spellItem.name);
    let damageType = "psychic";
    let effectData = [{
        changes: [
            { key: `macro.itemMacro.GM`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: lastArg.tokenId, priority: 20 },
            { key: `flags.dae.deleteUuid`, mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: conc.uuid, priority: 20 }
        ],
        origin: spellUuid,
        flags: {
            "dae": { itemData: spellItem.data, token: tactorTarget.uuid, macroRepeat: "startEveryTurn" },
            "core": { statusId: "Frightened" }
        },
        disabled: false,
        duration: { rounds: 10, startRound: gameRound, startTime: game.time.worldTime },
        icon: "icons/svg/terror.svg",
        label: "Frightened"
    }];

    if (conc) {
        const resist = ["Brave", "Fear Resilience"];
        const getResist = tactorTarget.items.find(i => resist.includes(i.name));
        const rollOptions = getResist ? { chatMessage: true, fastForward: true, advantage: true } : { chatMessage: true, fastForward: true };
        const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: "save", targetUuid: tactorTarget.uuid, ability: "wis", options: rollOptions });
        if (game.dice3d) game.dice3d.showForRoll(roll);
        if (roll.total < spellDC) {
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: effectData });
        }
        let concUpdate = await getProperty(tactor.data.flags, "midi-qol.concentration-data.targets");
        await concUpdate.push({ tokenUuid: tokenOrActorTarget.uuid, actorUuid: tactorTarget.uuid });
        await tactor.setFlag("midi-qol", "concentration-data.targets", concUpdate);
    }

    const diceMult = args[0].isCritical ? 2: 1;
    return { damageRoll: `${diceMult}d6[${damageType}]`, flavor: `(${itemName} (${CONFIG.DND5E.damageTypes[damageType]}))` };
}

if (args[0] === "on" && token !== sourceToken) {
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

if (args[0] === "each" && lastArg.efData.disabled === false && token !== sourceToken) {
    const targetToken = await fromUuid(lastArg.tokenUuid);
    const condition = "Frightened";
    const item = await fromUuid(lastArg.efData.origin);
    attemptRemoval(targetToken, condition, item);
}

if (args[0] === "off" && token !== sourceToken) {
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