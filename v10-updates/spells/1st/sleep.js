try {
	if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects") return;
	const targets = await args[0].targets.filter(t => t.actor && MidiQOL.typeOrRace(t.actor) && t.actor.system.attributes.hp.value && !t.actor.effects.find(e => e.name == "Unconscious" && !e.disabled)).sort((prev, curr) => prev.actor.system.attributes.hp.value < curr.actor.system.attributes.hp.value ? -1 : 1);
	let sleepHp = args[0].damageTotal;
	let sleepTargets = [];
	for (let target of targets) {
		const hp = target.actor.system.attributes.hp.value;
		const immuneType = ["undead", "construct"].find(c => target.actor.system.details?.race?.includes(c) || target.actor.system.details?.type?.value?.includes(c));
		const immuneCondition = target.actor.system.traits.ci.value.has("unconscious") || target.actor.system.traits.ci.value.has("charmed") || target.actor.system.traits.ci.custom.includes("Magical Sleep");
		if (immuneType || immuneCondition) {
			sleepTargets.push(`<div class="midi-qol-flex-container"><div>Resists</div><div class="midi-qol-target-npc midi-qol-target-name" id="${target.id}"></div><div><img src="${target.img}" width="30" height="30" style="border:0px"></div></div>`);
			continue;
		}
		if (sleepHp >= hp) {
			sleepHp -= hp;
			sleepTargets.push(`<div class="midi-qol-flex-container"><div>Slept</div><div class="midi-qol-target-npc midi-qol-target-name" id="${target.id}"></div><div><img src="${target.img}" width="30" height="30" style="border:0px"></div></div>`);
			const effectData = {
				name: "Sleep",
				icon: "icons/magic/light/explosion-star-small-pink.webp",
				disabled: false,
				origin: args[0].uuid,
				duration: { seconds: 60 },
				flags: { dae: { specialDuration: ["isDamaged"] } },
				changes: [{ key: "macro.CE", mode: 0, value: "Unconscious", priority: 20 }]
			};
			await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });
			continue;
		} else {
			sleepTarget.push(`<div class="midi-qol-flex-container"><div>misses</div><div class="midi-qol-target-npc midi-qol-target-name" id="${target.id}"></div><div><img src="${target.img}" width="30" height="30" style="border:0px"></div></div>`);
		}
	}
	const chatMessage = game.messages.get(args[0].itemCardId);
	let content = duplicate(chatMessage.system.content);
	const searchString = /<div class="midi-qol-hits-display">[\s\S]*<div class="end-midi-qol-hits-display">/g;
	const sleepResults = `<div><div class="midi-qol-nobox">${sleepTarget.join('')}</div></div>`;
	const replaceString = `<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display">${sleepResults}`;
	content = await content.replace(searchString, replaceString);
	await chatMessage.update({ content: content });
} catch (err) {console.error("Sleep Macro - ", err)}