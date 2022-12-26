// attempt removal macro
// execute as gm
// values : dc(int) type(string) abil/save(string) auto/opt(string)

try {
    const lastArg = args[args.length - 1];

    const token = canvas.tokens.get(lastArg.tokenId);
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

    if (args[0] === "each" && lastArg.efData.disabled === false) {
        const origin = await fromUuid(lastArg.efData.origin);
        const magicEffect = origin?.data?.data?.properties?.mgc || origin?.data?.flags?.midiProperties?.magiceffect || lastArg.efData?.flags?.magiceffect;
        const spellEffect = origin?.data?.type === "spell" || lastArg.efData?.flags?.spelleffect;
        const condition = lastArg.efData.label;
        const player = await playerForActor(tactor);
        const saveDC = args[1];
        const ability = args[2];
        const type = args[3];
        let attempt = false;
        if (args[4] === "opt") {
            attempt = await USF.socket.executeAsUser("useDialog", player.id, { title: `Use action to attempt to remove ${condition}?`, content: `` });
        }
        if (args[4] === "auto" || attempt) {
            const itemData = {
                name: `${condition} Save`,
                img: `${lastArg.efData.icon}`,
                type: "feat",
                flags: {
                    midiProperties: { magiceffect: (magicEffect ? true : false), spelleffect: (spellEffect ? true : false), }
                },
                data: {
                    activation: { type: "none", },
                    target: { type: "self", },
                    actionType: type,
                    ability: ability,
                    save: { dc: saveDC, ability: ability, scaling: "flat" },
                }
            }
            await tactor.createEmbeddedDocuments("Item", [itemData]);
            let saveItem = await tactor.items.find(i => i.name === itemData.name);
            let saveWorkflow = await MidiQOL.completeItemRoll(saveItem, { chatMessage: true, fastForward: true });
            await tactor.deleteEmbeddedDocuments("Item", [saveItem.id]);
            
            if (!saveWorkflow.failedSaves.has(token)) {
                let ef = tactor.effects.find(i => i.data === lastArg.efData);
                if (ef) await tactor.deleteEmbeddedDocuments("ActiveEffect", [ef.id]);
            }
        }
    }
} catch (err) {
    console.error("AttemptRemoval error", err);
    try {
        const lastArg = args[args.length - 1];
        const tokenOrActor = await fromUuid(lastArg.actorUuid);
        const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
        const saveItem = await tactor.items.find(i => i.name === `${lastArg.efData.label} Save`);
        await tactor.deleteEmbeddedDocuments("Item", [saveItem.id]);
    } catch (err) {
        console.error("AttemptRemoval Cleanup error", err);
    }
}