// fire form

const lastArg = args[args.length - 1];
let tokenOrActor = await fromUuid(lastArg.actorUuid);
let tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "on" && lastArg.tokenId !== game.combat?.current?.tokenId) {
    const applyDamage = game.macros.find(m => m.name === "ApplyDamage");
    if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, lastArg.tokenId, "1d10", "fire");
    const effectData = {
        changes: [
            { key: "macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "ApplyDamage self self 1d10 fire", priority: 20, },
            { key: "macro.execute", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "AttemptRemoval -9999 dex abil opt", priority: 20, },
        ],
        disabled: false,
        label: `Burning`,
        icon: `icons/magic/fire/flame-burning-embers-yellow.webp`,
        flags: { dae: { macroRepeat: "startEveryTurn", stackable: "noneName" }, core: { statusId: `Burning` } },
    };
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
}