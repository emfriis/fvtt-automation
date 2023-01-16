// preDamageRoll

function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users.find(u => u.data.character === actor.id && u.active);
	if (!user) user = game.users.players.find(p => p.active && actor.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users.find(p => p.isGM && p.active);
	return user;
}

function canSee(token, target) {
    let canSeeCV = game.modules.get('conditional-visibility')?.api?.canSee(token, target) ?? true;
    let canSeeLOS = !_levels?.advancedLosTestInLos(token, target);
    let canSeeLight = true;
    let inLight = _levels?.advancedLOSCheckInLight(target) ?? true;
    if (!inLight) {
        let vision = Math.min((token.data.flags["perfect-vision"].sightLimit ?? 9999), Math.max(token.data.dimSight, token.data.brightSight));
	    if (!vision || vision < MidiQOL.getDistance(token, target, false)) canSeeLight = false;
    }
    let canSee = canSeeCV && canSeeLOS && canSeeLight;
    return canSee;
}

Hooks.on("midi-qol.preDamageRoll", async (workflow) => {
    try {  

        // cutting words damage roll
        if (workflow.hitTargets.length && workflow.item.data.data.damage.parts && !["healing","temphp"].includes(workflow.item.data.data.damage.parts[0][1]) && !(workflow.item.data.data.save.dc && (workflow.superSavers.length || (workflow.item.data.flags.midiProperties.nodam && !workflow.failedSaves.length))) && !workflow.actor.data.data.traits.ci.value.includes("charmed") && !workflow.actor.effects.find(e => e.data.label === "Deafened")) {
            try {
                console.warn("Cutting Words Damage Roll activated");
                let wordTokens = await canvas.tokens.placeables.filter(p => {
                    let wordToken = (
                        p?.actor && // exists
                        p.actor.data.flags["midi-qol"].cuttingWords && // has feature
                        p.actor.items.find(i => i.name === "Bardic Inspiration" && i.data.data.uses.value) && // feature charged
                        !p.actor.effects.find(e => e.data.label === "Reaction") && // has reaction
                        p.data.disposition !== workflow.token.data.disposition && // is enemy
                        MidiQOL.getDistance(p, workflow.token, false) <= 60 && // in range
                        canSee(p, workflow.token) // can see
                    );
                    return wordToken;
                });
                for (let w = 0; w < wordTokens.length; w++) {
                    let word = wordTokens[w];
                    let featItem = word.actor.items.find(i => i.name === "Bardic Inspiration");
                    let uses = featItem.data.data.uses.value;
                    let player = await playerForActor(word.actor);
                    let useWord = false;
                    useWord = await USF.socket.executeAsUser("useDialog", player.id, { title: `Cutting Words`, content: `Use your reaction and a bardic inspiration die to reduce the damage roll?` });
                    if (useWord) {
                        let actorData = await word.actor.getRollData();
                        let bardLevel = actorData.classes?.bard?.levels;
                        let bardicDie = bardLevel >= 15 ? "1d12" : bardLevel >= 10 ? "1d10" : bardLevel >= 5 ? "1d8" : bardLevel >= 1 ? "1d6" : null;
                        if (!bardicDie) continue;
                        let roll = await USF.socket.executeAsUser("rollSimple", player.id, { rollable: bardicDie });
                        const effectData = [{
                            changes: [{ key: `data.bonuses.All-Damage`, mode: CONST.ACTIVE_EFFECT_MODES.ADD, value: `-${roll.total}`, priority: 20, }],
                            disabled: false,
                            label: "Cutting Words Damage Reduction",
                            origin: featItem.uuid,
                            flags: { dae: { specialDuration: ["1Hit","1Attack","1Spell","DamageDealt"] } },
                        }];
                        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: workflow.actor.uuid, effects: effectData });
                        if (featItem) await USF.socket.executeAsGM("updateItem", { itemUuid: featItem.uuid, updates: {"data.uses.value" : Math.max(0, uses - 1) } });
                        let hook = Hooks.on("midi-qol.preDamageRollComplete", async (workflowNext) => {
                            if (workflowNext.uuid === workflow.uuid) {
                                const effect = workflow.actor.effects.find(i => i.data.label === "Cutting Words Damage Reduction");
                                if (effect) await MidiQOL.socket().executeAsGM("removeEffects", { actorUuid: workflow.actor.uuid, effects: [effect.id] });
                                Hooks.off("midi-qol.preDamageRollComplete", hook);
                            }
                        });
                        if (game.combat) game.dfreds.effectInterface.addEffect({ effectName: "Reaction", uuid: word.actor.uuid });
                        console.warn("Cutting Words Damage Roll used");
                    }
                }
            } catch (err) {
                console.error("Cutting Words Damage Roll error", err);
            }
        }
    } catch(err) {
        console.error("preDamageRoll error", err);
    }
});