// mirror image
// requires MIDI-QOL, DAE, PERFECT-VISION

const lastArg = args[args.length - 1];
const token = canvas.tokens.get(lastArg.tokenId);
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ?? tokenOrActor;

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

async function cleanUp(removeEf) {
	const flag1 = await DAE.getFlag(tactor, "miHook");
	if (flag1) {
		Hooks.off("midi-qol.preCheckHits", flag1);
		await DAE.unsetFlag(tactor, "miHook");
	}
	const flag2 = await DAE.getFlag(tactor, "miLeft");
	if (flag2) {
		await DAE.unsetFlag(tactor, "miLeft");
	}
	if (removeEf) {
		let mi = tactor.effects.find(i => i.data.label === "Mirror Image");
		if (mi) await tactor.deleteEmbeddedDocuments("ActiveEffect", [mi.id]);
	}
}

async function miCheck(workflow) {
	let target = Array.from(workflow.targets)[0];
    if (!target) return;
	let targetId = target.id ?? target._id;
	const attackRoll = workflow.attackRoll;
	if (!attackRoll || attackRoll.total == 9999) return;
	
	let attacker = workflow.token;
	const senses = workflow.actor.data.data.attributes.senses;
	const aVisRange = attacker.data.flags["perfect-vision"].sightLimit ? attacker.data.flags["perfect-vision"].sightLimit : 9999;
	const aVision = Math.min(aVisRange, Math.max(senses.blindsight, senses.tremorsense, senses.truesight, 0));
	const aDist = MidiQOL.getDistance(attacker, token, false);
	let miIgnore = aVision >= aDist;
	if (miIgnore) {
		let canSeeTarget = true;
		if (game.modules.get("conditional-visibility")?.active && game.modules.get("levels")?.active && _levels) { 
			canSeeTarget = game.modules.get('conditional-visibility')?.api?.canSee(attacker, token) && _levels?.advancedLosTestVisibility(attacker, token);
		} 
		miIgnore = canSeeTarget;
	}
	let miLeft = await DAE.getFlag(tactor, "miLeft");
	let miDC = miLeft == 3 ? 6 : miLeft == 2 ? 8 : miLeft == 1 ? 11 : null;
	let miAC = 10 + tactor.data.data.abilities.dex.mod;
	if (["mwak", "msak", "rwak", "rsak"].includes(workflow.item.data.data.actionType) && lastArg.tokenId == targetId && !miIgnore) {
		const roll = new Roll(`1d20`).evaluate({ async: false });
		if (game.dice3d) game.dice3d.showForRoll(roll);
		if (roll.total >= miDC) {
			workflow.noAutoDamage = true;
			miLeft -= 1;
			if (attackRoll.total >= miAC) {
				await updateChatCard(workflow.itemCardId, target, roll.total, true, miLeft);
				if (miLeft < 1) {
					cleanUp(true);
				}
				DAE.setFlag(tactor, "miLeft", miLeft);
			} else if (attackRoll.total < miAC) {
				await updateChatCard(workflow.itemCardId, target, roll.total, false, miLeft);
			}
		} else if (roll.total < miDC) {
			await updateChatCardFailed(workflow.itemCardId, target, roll.total);
		}
	}
}

async function updateChatCardFailed(itemCardId, target, attackRoll) {
	const chatMessage = await game.messages.get(itemCardId, target);
	let chatMessageContent = $(await duplicate(chatMessage.data.content));
	chatMessageContent.find(".midi-qol-hits-display").append(`<div class="midi-qol-flex-container">
				<div>
					Mirror Image Roll: <b>${attackRoll}</b>
				</div>
			</div>`);
	await chatMessage.update({ content: chatMessageContent.prop('outerHTML') });
}

async function updateChatCard(itemCardId, target, attackRoll, hit, remaining) {
	const chatMessage = await game.messages.get(itemCardId, target);
	// console.log(chatMessage);
	let chatMessageContent = $(await duplicate(chatMessage.data.content));
	// console.log(chatMessageContent);
	chatMessageContent.find(".midi-qol-hits-display").empty();
	chatMessageContent.find(".midi-qol-hits-display").append(`<div class="midi-qol-flex-container">
				<div>
					Mirror Image Roll: <b>${attackRoll}</b>  - Attack ${hit ? 'hits' : 'misses'}
				</div>
				<div class="midi-qol-target-npc-GM midi-qol-target-name" id="${target.id}"> ${target.name}'s Mirror Image, ${remaining} remaining!</div>
				<div class="midi-qol-target-npc-Player midi-qol-target-name" id="${target.id}"> ${target.name}'s Mirror Image, ${remaining} remaining!
				</div>
				<div><img src="${target.data.img}" width="30" height="30" style="border:0px">
				</div>
			</div>`);
	await chatMessage.update({ content: chatMessageContent.prop('outerHTML') });
}

if (args[0] === "on") {
	DAE.setFlag(tactor, "miLeft", 3);
	let hookId = Hooks.on("midi-qol.preCheckHits", miCheck);
    DAE.setFlag(tactor, "miHook", hookId);
}

if (args[0] === "off") {
	await cleanUp(false);
}