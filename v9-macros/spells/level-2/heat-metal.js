// heat metal
// on use post effects
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users?.find(u => u.data.character === actor?.id && u.active);
	if (!user) user = game.users?.players.find(p => p.active && actor?.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users?.find(p => p.isGM && p.active);
	return user;
}

if (args[0].tag === "OnUse" && lastArg.macroPass === "postActiveEffects" && lastArg.targets.length) {
    let tokenTarget = lastArg.hitTargets[0];
    let tactorTarget = tokenTarget.actor;
    if (!tactorTarget) return;

    let save = await USF.socket.executeAsGM("attemptSaveDC", { actorUuid: tactorTarget.uuid, saveName: `${lastArg.item.name} Save`, saveImg: lastArg.item.img, saveType: "save", saveDC: tactor.data.data.attributes.spelldc, saveAbility: "con", magiceffect: true, spelleffect: true });
    let content = save ? "Drop the heated item?" : "Drop the heated item? (Must drop the item if able)";
    let player = await playerForActor(tactorTarget);
    let drop = false;
    if (player) drop = await USF.socket.executeAsUser("useDialog", player.id, { title: `Heat Metal`, content: content });
    if (!drop) {
        let effectData = {
            changes: [
                { key: `flags.midi-qol.disadvantage.attack.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 },
                { key: `flags.midi-qol.disadvantage.ability.check.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 }
            ],
            origin: tactor.uuid,
            flags: { "dae": { specialDuration: ["turnStartSource"] } },
            disabled: false,
            icon: lastArg.item.img,
            label: lastArg.item.name + " Disadvantage"
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
    }

    let conc = tactor.effects.find(i => i.data.label === "Concentrating");
    if (conc) {
        let concFlagsDAE = duplicate(conc.data.flags.dae);
        let updates = [{
            "_id": conc.id,
            "changes": [{ key: "macro.itemMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: `${lastArg.targets[0].id} ${lastArg.spellLevel}`, priority: 20 }].concat(conc.data.changes),
            "flags.dae": Object.assign(concFlagsDAE, { itemData: lastArg.item, macroRepeat: "startEveryTurn" }),
        }];
        console.error(updates);
        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: updates });
        console.error(conc);
    }
}

if (args[0] === "each") {
    let player1 = await playerForActor(tactor);
    let redo = false;
    if (player1) redo = await USF.socket.executeAsUser("useDialog", player1.id, { title: `Heat Metal`, content: `Use your bonus action to cause the damage again?` });
    if (!redo) return;
    
    let tokenTarget = canvas.tokens.get(args[1]);
    let tactorTarget = tokenTarget?.actor;
    if (!tactorTarget) return;
    
    let applyDamage = game.macros.find(m => m.name === "ApplyDamage");
    if (applyDamage) await applyDamage.execute("ApplyDamage", lastArg.tokenId, args[1], `${args[2]}d8`, "fire", "magiceffect", "spelleffect");

    let save = await USF.socket.executeAsGM("attemptSaveDC", { actorUuid: tactorTarget.uuid, saveName: `Heat Metal Save`, saveImg: "icons/magic/fire/blast-jet-stream-embers-orange.webp", saveType: "save", saveDC: tactor.data.data.attributes.spelldc, saveAbility: "con", magiceffect: true, spelleffect: true });
    let content = save ? "Drop the heated item?" : "Drop the heated item? (Must drop the item if able)";
    let player2 = await playerForActor(tactorTarget);
    let drop = false;
    if (player2) drop = await USF.socket.executeAsUser("useDialog", player2.id, { title: `Heat Metal`, content: content });
    if (!drop) {
        let effectData = {
            changes: [
                { key: `flags.midi-qol.disadvantage.attack.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 },
                { key: `flags.midi-qol.disadvantage.ability.check.all`, mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: 1, priority: 20 }
            ],
            origin: tactor.uuid,
            flags: { "dae": { specialDuration: ["turnStartSource"] } },
            disabled: false,
            icon: "icons/magic/fire/blast-jet-stream-embers-orange.webp",
            label: "Heat Metal Disadvantage"
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactorTarget.uuid, effects: [effectData] });
    }
}