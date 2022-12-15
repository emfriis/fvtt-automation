// chill touch
// on use post effects

const lastArg = args[args.length - 1];
if (lastArg.hitTargets.length === 0) return {};
const target = canvas.tokens.get(lastArg.hitTargets[0].id);
const creatureTypes = ["undead"];
const undead = creatureTypes.some(i => (target.actor.data.data.details?.type?.value || target.actor.data.data.details?.race).toLowerCase().includes(i));
const itemD = lastArg.item;
const spellSeconds = itemD.data.duration.value * 6;
const gameRound = game.combat ? game.combat.round : 0;
const effectName = `${itemD.name} Effect`;
let undeadDis = [{ "key": "data.traits.di.value", "mode": CONST.ACTIVE_EFFECT_MODES.CUSTOM, "value": "healing", "priority": 20 }];
if (undead) undeadDis.push({ "key": "flags.midi-qol.disadvantage.attack.all", "mode": CONST.ACTIVE_EFFECT_MODES.CUSTOM, "value": 1, "priority": 20 });
let effectData = {
    label: effectName,
    icon: "icons/magic/unholy/hand-claw-fire-blue.webp",
    origin: lastArg.uuid,
    disabled: false,
    flags: { dae: { itemData: itemD } },
    duration: { rounds: itemD.data.duration.value, seconds: spellSeconds, startRound: gameRound, startTime: game.time.worldTime },
    changes: undeadDis
};
let checkEffect = target.actor.effects.find(i => i.data.label === effectName);
if (checkEffect) return {};
await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: target.actor.uuid, effects: [effectData] });