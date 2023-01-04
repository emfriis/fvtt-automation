// confusion
// effect itemacro

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "on" && lastArg.efData.label === "Confusion") {
    const effectData = {
        changes: [
            { key: "macro.itemMacro", mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM, value: "", priority: 20, }
        ],
        disabled: false,
        label: "Confused",
        icon: "icons/magic/air/wind-tornado-cyclone-purple-pink.webp",
        origin: lastArg.efData.origin,
        flags: { dae: { itemData: lastArg.efData.flags.dae.itemData, macroRepeat: "startEveryTurn" } }
    }
    await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: tactor.uuid, effects: [effectData] });
    const effect = tactor.effects.find(e => e.data.label === "Confused" && e.data.origin === lastArg.efData.origin);
    if (effect) {
        const changes = [{ key: "flags.dae.deleteUuid", mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE, value: effect.uuid, priority: 20, }];
        await MidiQOL.socket().executeAsGM("updateEffects", { actorUuid: tactor.uuid, updates: [{ _id: lastArg.efData._id, changes: changes.concat(lastArg.efData.changes) }] });
    }
}

if (args[0] === "each" && lastArg.efData.label === "Confused") {
    const roll1 = await new Roll(`1d10`).evaluate({ async: false });
    if (game.dice3d) game.dice3d.showForRoll(roll1);
    switch (roll1.total) {
        case 1:
            const roll2 = await new Roll(`1d8`).evaluate({ async: false });
            if (game.dice3d) game.dice3d.showForRoll(roll2);
            let direction;
            switch (roll2.total) {
                case 1:
                    direction = "up";
                    break;
                case 2:
                    direction = "up and to the right";
                    break;
                case 3:
                    direction = "to the right";
                    break;
                case 4:
                    direction = "down and to the right";
                    break;
                case 5:
                    direction = "down";
                    break;
                case 6:
                    direction = "down and to the left";
                    break;
                case 7:
                    direction = "to the left";
                    break;
                case 8:
                    direction = "up and to the left";
                    break;
                default:
                    break; 
            }
            ChatMessage.create({ content: `The Confused Creature uses all its movement to move horizontally ${direction}. The creature doesn't take an action this turn.` });
            break;
        case 2: case 3: case 4: case 5: case 6:
            ChatMessage.create({ content: `The Confused Creature doesn't move or take actions this turn.` });
            break;
        case 7: case 8:
            ChatMessage.create({ content: `The Confused Creature uses its action to make a melee attack against a randomly determined creature within its reach. If there is no creature within its reach, the creature does nothing this turn.` });
            break;
        case 9: case 10:
            ChatMessage.create({ content: `The Confused Creature can act and move normally this turn.` });
            break;
        default:
            break;
    }
}