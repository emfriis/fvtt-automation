try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects") return;
    const summonId = args[0].item._id + '-' + args[0].itemCardId;
    let hook = Hooks.on("summonComplete", async (summonIdNext, summons) => {
        if (summonId != summonIdNext) return;
        summons.tokenIds.forEach(async (t) => { 
            let token = canvas.tokens.get(t);
            let actor = token?.actor;
            if (!token || !actor || !MidiQOL.raceOrType(actor)) return;
            await actor.update({ "system.attributes.hp.temp": 30 });
        });
        Hooks.off("summonComplete", hook);
    });
} catch (err) {console.error("Durable Summons Macro - ", err)}