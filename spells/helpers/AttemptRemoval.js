const lastArg = args[args.length - 1];

async function attemptRemoval(targetToken, condition, item, isCheck, abilityType) {
    if (game.dfreds.effectInterface.hasEffectApplied(condition, targetToken.uuid)) {
        new Dialog({
        title: `Use action to attempt to remove ${condition}?`,
        buttons: {
            one: {
            label: "Yes",
            callback: async () => {
                const caster = item.parent;
                const saveDc = caster.data.data.attributes.spelldc;
                const removalCheck = isCheck;
                const ability = abilityType;
                const type = removalCheck ? "abil" : "save"; // can be "abil", "save", or "skill"
                const targetUuid = targetToken.actor.uuid;
                const rollOptions = { chatMessage: true, fastForward: true };
                const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: type, targetUuid: targetUuid, ability: ability, options: rollOptions });
                if (game.dice3d) game.dice3d.showForRoll(roll);

                if (roll.total >= saveDc) {
                    game.dfreds.effectInterface.removeEffect({ effectName: condition, uuid: targetToken.uuid });
                } else {
                    if (roll.total < saveDc) ChatMessage.create({ content: `${targetToken.name} fails the roll for ${item.name}, still has the ${condition} condition.` });
                }
            },
            },
            two: {
            label: "No",
            callback: () => {},
            },
        },
        }).render(true);
    }
}

if (args[0] === "each") {
    const targetToken = await fromUuid(lastArg.tokenUuid);
    const condition = "Restrained";
    attemptRemoval(targetToken, condition);
}




async function attemptRemoval(targetToken, condition, item, isCheck, abilityType) {
    if (game.dfreds.effectInterface.hasEffectApplied(condition, targetToken.uuid)) {
        let player = await playerForActor(token?.actor);
        let socket = socketlib.registerModule("user-socket-functions");
        let attempt = false;
        attempt = await socket.executeAsUser("useDialog", player.id, { title: `Use action to attempt to remove ${condition}`, content: `` });
        if (attempt) {
            const caster = item.parent;
            const saveDc = caster.data.data.attributes.spelldc;
            const removalCheck = isCheck;
            const ability = abilityType;
            const type = removalCheck ? "check" : "save";
            const flavor = `${condition} (via ${item.name}) : ${CONFIG.DND5E.abilities[ability]} ${type} vs DC${saveDc}`;
            const rollResult = removalCheck
            ? (await targetToken.actor.rollAbilityTest(ability, { flavor })).total
            : (await targetToken.actor.rollAbilitySave(ability, { flavor })).total;

            if (rollResult >= saveDc) {
            game.dfreds.effectInterface.removeEffect({ effectName: condition, uuid: targetToken.uuid });
            } else {
            if (rollResult < saveDc) ChatMessage.create({ content: `${targetToken.name} fails the ${type} for ${item.name}, still has the ${condition} condition.` });
            }
        }
    }
}



await attemptRemoval(targetToken, condition, item, isCheck, abilityType);

// using midi qol - still doesnt offer tokenbar roll if active - is better I think?

async function attemptRemoval(targetToken, condition, item, isCheck, abilityType) {
    if (game.dfreds.effectInterface.hasEffectApplied(condition, targetToken.uuid)) {
        new Dialog({
        title: `Use action to attempt to remove ${condition}?`,
        buttons: {
            one: {
            label: "Yes",
            callback: async () => {
                const caster = item.parent;
                const saveDc = caster.data.data.attributes.spelldc;
                const removalCheck = isCheck;
                const ability = abilityType;
                const type = removalCheck ? "abil" : "save"; // can be "abil", "save", or "skill"
                const targetUuid = targetToken.actor.uuid;
                const rollOptions = { chatMessage: true, fastForward: true };
                const roll = await MidiQOL.socket().executeAsGM("rollAbility", { request: type, targetUuid: targetUuid, ability: ability, options: rollOptions });
                if (game.dice3d) game.dice3d.showForRoll(roll);

                if (roll.total >= saveDc) {
                    game.dfreds.effectInterface.removeEffect({ effectName: condition, uuid: targetToken.uuid });
                } else {
                    if (roll.total < saveDc) ChatMessage.create({ content: `${targetToken.name} fails the roll for ${item.name}, still has the ${condition} condition.` });
                }
            },
            },
            two: {
            label: "No",
            callback: () => {},
            },
        },
        }).render(true);
    }
}

/*
let player = await playerForActor(token?.actor);
let socket = socketlib.registerModule("user-socket-functions");
let useCounter = false;
useCounter = await socket.executeAsUser("useDialog", player.id, { title: `Counterspell`, content: `Use your reaction to cast Counterspell?` });
if (useCounter) {
*/