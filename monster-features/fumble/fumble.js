    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

    if (args[0].tag === "OnUse" && args[0].item.name === "Scimitar") {
        if (game.combat) {
            const fumbleTime = `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`;
            const lastTime = tactor.getFlag("midi-qol", "fumbleTime");
            if (fumbleTime === lastTime) {
                let workflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
                workflow.disadvantage = true;
            } else {
                await tactor.setFlag("midi-qol", "fumbleTime", fumbleTime);
            };
        };
    };