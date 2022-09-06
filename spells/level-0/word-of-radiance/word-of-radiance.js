// word of radiance

async function wait(ms) { return new Promise(resolve => { setTimeout(resolve, ms); }); }
(async () => {
    let tokenD = canvas.tokens.get(args[0].tokenId);
    let actorD = game.actors.get(args[0].actor._id);
    let distance = 5;
    let itemD = args[0].item;
    let dc = await actorD.getRollData().attributes.spelldc;
    let get_target = canvas.tokens.placeables.filter(target => (MidiQOL.getDistance(tokenD, target, false) <= distance && tokenD.data.disposition != target.data.disposition && !canvas.walls.checkCollision(new Ray(tokenD.center, target.center))));
    let level = actorD.data.type === "character" ? actorD.data.data.details.level : actorD.data.data.details.cr;
    let numDice = 1 + (Math.floor((level + 1) / 6));
	let bonus = 0;
	if (actorD.items.find(i => ["Potent Spellcasting"].includes(i.name)) && actorD.data.data.abilities.wis.mod > 0) bonus += actorD.data.data.abilities.wis.mod;
    let damageRoll = new Roll(`${numDice}d6 + ${bonus}`).evaluate({ async: false });
    let abilitySave = "con";
    let saveName = CONFIG.DND5E.abilities[abilitySave];
    game.dice3d?.showForRoll(damageRoll);
    let damageResult = [];
    let hitTargets = [];
    for (let target of get_target) {
        let save;
        await target.actor.hasPlayerOwner ? save = await target.actor.rollAbilitySave(abilitySave, { chatMessage: false }) : save = await target.actor.rollAbilitySave(abilitySave, { chatMessage: false, fastForward: true });
        game.dice3d?.showForRoll(save);
        if (save.total >= dc) {
            damageResult.push(`<div class="midi-qol-flex-container"><div class="midi-qol-target-npc midi-qol-target-name" id="${target.id}"> Target saves </div><div><img src="${target.data.img}" width="30" height="30" style="border:0px"></div></div>`);

        } else {
            damageResult.push(`<div class="midi-qol-flex-container"><div class="midi-qol-target-npc midi-qol-target-name" id="${target.id}"> Target fails </div><div><img src="${target.data.img}" width="30" height="30" style="border:0px"></div></div>`);
            hitTargets.push(target);
        }
    }
    new MidiQOL.DamageOnlyWorkflow(actorD, tokenD, damageRoll.total, "radiant", hitTargets, damageRoll, { flavor: `(Radiant)`, itemCardId: args[0].itemCardId });
    let damageList = damageResult.join('');
    await wait(1000);
    let damage_results = `<div class="midi-qol-nobox midi-qol-bigger-text">${itemD.name} DC ${dc} ${saveName} Saving Throw:</div><div><div class="midi-qol-nobox">${damageList}</div></div>`;
    const chatMessage = await game.messages.get(args[0].itemCardId);
    let content = await duplicate(chatMessage.data.content);
    const searchString = /<div class="midi-qol-hits-display">[\s\S]*<div class="end-midi-qol-hits-display">/g;
    const replaceString = `<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display">${damage_results}`;
    content = await content.replace(searchString, replaceString);
    await chatMessage.update({ content: content });
})();