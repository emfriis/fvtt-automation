// manifest mind
// on use pre item
// effect itemacro
// effect on use pre item

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

async function playerForActor(actor) {
	if (!actor) return undefined;
	let user;
	if (actor.hasPlayerOwner) user = game.users.find(u => u.data.character === actor.id && u.active);
	if (!user) user = game.users.players.find(p => p.active && actor.data.permission[p.id ?? ""] === CONST.ENTITY_PERMISSIONS.OWNER);
	if (!user) user = game.users.find(p => p.isGM && p.active);
	return user;
}

async function postWarp(location, spawnedTokenDoc, updates, iteration) {
    let ef = tactor.effects.find(i => i.data.label === "Manifest Mind");
    let summonUuid = spawnedTokenDoc.uuid;
    if (ef) {
        let changes = [
            { key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: summonUuid, priority: 20, },
            { key: "flags.midi-qol.manifestMind", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: spawnedTokenDoc.data._id, priority: 20, },
        ];
        await ef.update({ changes: changes.concat(ef.data.changes) });
    }
}

if (args[0] === "on") {
    let updates = {
        token: { "name": `Awakened Spellbook (${tactor.name})`, "dimSight": 60 },
        actor: { "name": `Awakened Spellbook (${tactor.name})`, },
    }
    await warpgate.spawn("Dancing Light", updates, { post: postWarp }, {});
}

if (args[0].tag === "OnUse" && lastArg.item.name === "Manifest Mind" && !tactor.effects.find(e => e.data.label === "Manifest Mind")) {
    let item = await fromUuid(lastArg.uuid);
    if (item.data.data.uses.value) return;
    let player = await playerForActor(tactor);
    let slotUse = await USF.socket.executeAsUser("spellUseDialog", player.id, { actorData: duplicate(tactor.data), title: "Manifest Mind" });
    if (!slotUse) return;
    let objUpdate = new Object();
    objUpdate['data.spells.' + slotUse.level + '.value'] = Math.max(0, tactor.data.data.spells[slotUse.level]?.value - 1);
    await tactor.update(objUpdate);
    await item.update({ "data.uses.value": 1 });
}

if (args[0].tag === "OnUse" && lastArg.item.type === "spell" && lastArg.item.data.preparation.mode === "prepared" && (tactor.data.flags["midi-qol"]?.manifestMindCasts ?? 0) < tactor.data.data.attributes.prof) {
    let casts = tactor.data.flags["midi-qol"]?.manifestMindCasts ?? 0;
    let dialog = new Promise((resolve, reject) => {
        new Dialog({
            title: "Cast Spell as your Awakened Spellbook?",
            content: `(${tactor.data.data.attributes.prof - casts} casts remaining today)`,
            buttons: {
                Ok: {
                    label: "Ok",
                    callback: () => {resolve(true)},
                },
                Cancel: {
                    label: "Cancel",
                    callback: () => {resolve(false)},
                },
            },
            default: "Cancel",
            close: () => {resolve(false)}
        }).render(true);
    });
    cast = await dialog;
    if (!cast) return;
    let effectData = {
        changes: [{ key: "flags.midi-qol.manifestMindCasts", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: casts + 1, priority: 20, }],
        label: "Manifest Mind Casts",
        disabled: false,
        icon: "icons/sundries/books/book-open-purple.webp",
        flags: { dae: { specialDuration: ["longRest"], stackable: "noneName" } },
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
    const workflow = MidiQOL.Workflow.getWorkflow(lastArg.uuid);
    if (tactor.data.flags["midi-qol"].manifestMind) var token = canvas.tokens.get(tactor.data.flags["midi-qol"].manifestMind);
    if (token) workflow.token = token;
}