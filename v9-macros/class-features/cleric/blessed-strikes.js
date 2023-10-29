// blessed strikes
// damage bonus

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

try {
    if (args[0].tag !== "DamageBonus" || lastArg.hitTargets.length === 0) return;
    const isCantrip = lastArg.item.type === "spell" && lastArg.spellLevel === 0;
    const isWeapon = lastArg.item.type === "weapon" && ["mwak", "rwak"].includes(lastArg.item.data.actionType);
    if (!isCantrip && !isWeapon) return;
    if (game.combat && tactor.data.flags["midi-qol"].blessedTime === `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`) return;
    if (game.combat) await tactor.setFlag("midi-qol", "blessedTime", `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`);
    if (game.combat && isCantrip && !isWeapon && lastArg.item.data.actionType === "save" && lastArg.item.flags.midiProperties?.nodam && !tactor.data.flags["midi-qol"].potentCantrip) {
        let hook = Hooks.on("midi-qol.postCheckSaves", async workflowNext => {
            if (workflowNext.uuid === lastArg.uuid) {
                if (workflowNext.failedSaves.size === 0) {
                    if (game.combat) await tactor.unsetFlag("midi-qol", "blessedTime");
                    Hooks.off("midi-qol.postCheckSaves", hook);
                }
            }
        });
    }
    const diceMult = lastArg.isCritical ? 2 : 1;
    return { damageRoll: `${diceMult}d8[radiant]`, flavor: "Blessed Strikes" };
} catch (err) {
    console.error("Blessed Strikes macro error", err);
}