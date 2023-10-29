// sleep
// on use pre effects
// item damage 5d8 "No Damage"

const sleepHp = await args[0].damageTotal;
const condition = "Unconscious";
console.log(`Sleep Spell => Available HP Pool [${sleepHp}] points`);
const targets = await args[0].targets.filter((i) => i.actor.data.data.attributes.hp.value != 0 && !i.actor.effects.find(x => x.data.label === condition)).sort((a, b) => canvas.tokens.get(a.id).actor.data.data.attributes.hp.value < canvas.tokens.get(b.id).actor.data.data.attributes.hp.value ? -1 : 1);
let remainingSleepHp = sleepHp;
let sleepTarget = [];

for (let target of targets) {
    const findTarget = await canvas.tokens.get(target.id);
    const immuneType = findTarget.actor.data.type === "character" ? ["undead", "construct"].some(race => (findTarget.actor.data.data.details.race || "").toLowerCase().includes(race)) : ["undead", "construct"].some(value => (findTarget.actor.data.data.details.type.value || "").toLowerCase().includes(value));
    const immuneCI = findTarget.actor.effects.find((i) => i.data.label === "Fey Ancestry");
    const sleeping = findTarget.actor.effects.find((i) => i.data.label === condition);
    const targetHpValue = findTarget.actor.data.data.attributes.hp.value;
    if ((immuneType) || (immuneCI) || (sleeping)) {
        console.log(`Sleep Results => Target: ${findTarget.name} | HP: ${targetHpValue} | Status: Resists`);
        sleepTarget.push(`<div class="midi-qol-flex-container"><div>Resists</div><div class="midi-qol-target-npc midi-qol-target-name" id="${findTarget.id}"> ${findTarget.name}</div><div><img src="${findTarget.data.img}" width="30" height="30" style="border:0px"></div></div>`);
        continue;
    }
    if (remainingSleepHp >= targetHpValue) {
        remainingSleepHp -= targetHpValue;
        console.log(`Sleep Results => Target: ${findTarget.name} |  HP: ${targetHpValue} | HP Pool: ${remainingSleepHp} | Status: Slept`);
        sleepTarget.push(`<div class="midi-qol-flex-container"><div>Slept</div><div class="midi-qol-target-npc midi-qol-target-name" id="${findTarget.id}"> ${findTarget.name}</div><div><img src="${findTarget.data.img}" width="30" height="30" style="border:0px"></div></div>`);
        const gameRound = game.combat ? game.combat.round : 0;
        const effectData = {
            label: "Unconscious",
            disabled: false,
            duration: { rounds: 10, seconds: 60, startRound: gameRound, startTime: game.time.worldTime },
            flags: { dae: { specialDuration: ["isDamaged"] } },
            changes: [
                { key: "StatusEffect", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "Convenient Effect: Unconscious", priority: 20 },
            ]
        };
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: findTarget.actor.uuid, effects: [effectData] });
        continue;
    } else {
        console.log(`Sleep Results => Target: ${target.name} | HP: ${targetHpValue} | HP Pool: ${remainingSleepHp - targetHpValue} | Status: Missed`);
        sleepTarget.push(`<div class="midi-qol-flex-container"><div>misses</div><div class="midi-qol-target-npc midi-qol-target-name" id="${findTarget.id}"> ${findTarget.name}</div><div><img src="${findTarget.data.img}" width="30" height="30" style="border:0px"></div></div>`);
    }
}
const sleptResults = `<div><div class="midi-qol-nobox">${sleepTarget.join('')}</div></div>`;
const chatMessage = game.messages.get(args[0].itemCardId);
let content = duplicate(chatMessage.data.content);
const searchString = /<div class="midi-qol-hits-display">[\s\S]*<div class="end-midi-qol-hits-display">/g;
const replaceString = `<div class="midi-qol-hits-display"><div class="end-midi-qol-hits-display">${sleptResults}`;
content = await content.replace(searchString, replaceString);
await chatMessage.update({ content: content });