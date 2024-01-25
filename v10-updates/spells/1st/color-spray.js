try {
	if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects") return;
	const targets = await args[0].targets.filter(t => t.actor && MidiQOL.typeOrRace(t.actor) && t.actor.system.attributes.hp.value && !t.actor.effects.find(e => e.name == "Unconscious" && !e.disabled)).sort((prev, curr) => prev.actor.system.attributes.hp.value < curr.actor.system.attributes.hp.value ? -1 : 1);
	let colorSprayHp = args[0].damageTotal;
	let colorSprayTargets = [];
	for (let target of targets) {
		const hp = target.actor.system.attributes.hp.value;
        const senses = target.actor.system.attributes.senses;
		const immuneSenses = Math.max(0, senses.darkvision, senses.truesight) < Math.max(0, senses.blindsight, senses.tremorsense);
		const immuneCondition = target.actor.system.traits.ci.value.has("unconscious") || target.actor.system.traits.ci.value.has("blinded");
		if (immuneSenses || immuneCondition) {
			colorSprayTargets.push(`<div class="midi-qol-flex-container"><div>Resists</div><div class="midi-qol-target-npc midi-qol-target-name" id="${target.id}"></div><div><img src="${target.img}" width="30" height="30" style="border:0px"></div></div>`);
			continue;
		}
		if (colorSprayHp >= hp) {
			colorSprayHp -= hp;
			colorSprayTargets.push(`<div class="midi-qol-flex-container"><div>Slept</div><div class="midi-qol-target-npc midi-qol-target-name" id="${target.id}"></div><div><img src="${target.img}" width="30" height="30" style="border:0px"></div></div>`);
			const effectData = {
				name: "Color Spray",
				icon: "icons/magic/air/fog-gas-smoke-dense-blue.webp",
				disabled: false,
				origin: args[0].uuid,
                duration: { seconds: 7 },
				flags: { dae: { specialDuration: ["turnEndSource", "combatEnd"] } },
				changes: [{ key: "macro.CE", mode: 0, value: "Blinded", priority: 20 }]
			};
			await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });
			continue;
		} else {
			colorSprayTarget.push(`<div class="midi-qol-flex-container"><div>misses</div><div class="midi-qol-target-npc midi-qol-target-name" id="${target.id}"></div><div><img src="${target.img}" width="30" height="30" style="border:0px"></div></div>`);
		}
	}
	const chatMessage = game.messages.get(args[0].itemCardId);
	let content = duplicate(chatMessage.system.content);
	const searchString = /<div class="midi-qol-hits-display">[\s\S]*<div class="end-midi-qol-hits-display">/g;
	const colorSprayResults = `<div><div class="midi-qol-nobox">${colorSprayTarget.join('')}</div></div>`;
	const replaceString = `<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display">${colorSprayResults}`;
	content = await content.replace(searchString, replaceString);
	await chatMessage.update({ content: content });
} catch (err) {console.error("Sleep Macro - ", err)}