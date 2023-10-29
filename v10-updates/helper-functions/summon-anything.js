// args in item activation condition - comma separated
// type = creature types - breakline separated
// name = creature name - breakline separated
// cr = cr range - min and max dash separated or single value
// amount = amount to summon default 1

try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects") return;
    const filters = args[0].item.system?.activation?.condition?.replace(" ", "")?.split(",");
    let summonFilters = [];
    let summonAmount = 1;
    for (let f = 0; f < filters.length; f++) {
        const filter = filters[f]?.split("=");
        if (!filter || filter.length != 2) return ui.notifications.warn("Invalid summon filter provided");
        const filterType = filter[0];
        const filterStrings = filter[1]?.split("|");
        switch (filterType) {
            case "type":
                summonFilters.push({ name: `Creature Types: ${filterStrings.join(", ")}`, locked: true, function: (index) => { return index.filter(i => filterStrings.find(s => i.system.details?.type?.value?.toLowerCase().includes(s.toLowerCase()) || i.system.details?.race?.toLowerCase().includes(s.toLowerCase()))) } });
                break;
            case "name":
                summonFilters.push({ name: `Names: ${filterStrings.join(", ")}`, locked: true, function: (index) => { return index.filter(i => filterStrings.find(s => i.name.trim().toLowerCase() == s.toLowerCase())) } });
                break;
            case "cr":
                const range = filterStrings[0]?.split("-");
                const minCR = +range[0];
                const maxCR = +range[range.length - 1];
                if (isNaN(minCR) || isNaN(maxCR)) return ui.notifications.warn("Invalid CR range provided for summoning");
                funcs.push({ name: `Challenge Ratings: ${minCR}-${maxCR}`, locked: true, function: (index) => { return index.filter(i => i.system.details?.cr >= minCR && i.system.details?.cr <= maxCR) } });
                break;
            case "amount":
                summonAmount = eval(filterStrings[0]?.replace(/[A-Za-z.]+|\[\d+\]/g, (i) => (args[0][i])));
                if (isNaN(summonAmount)) return ui.notifications.warn("Invalid amount provided for summoning");
                break;
            default:
                return ui.notifications.warn("Invalid summon filter provided");
        }
    }
    await foundrySummons.openMenu({ sourceTokens: [args[0].workflow.token], filters: summonFilters, amount: { value: summonAmount, locked: true }, updates: { actor: { permissions: { [game.user._id]: 3 } }, token: { disposition: args[0].workflow.token.document.disposition, flags: { summonId: args[0].item.id + '-' + args[0].itemCardId } } }, options: { autoPick: true, defaultFilters: true, defaultSorting: true } });
    const duration = args[0].item.system.duration;
    if (!duration.value || !["round", "minute", "hour", "day"].includes(duration.units)) return;
    let seconds = duration.value;
    switch (duration.units) {
        case "round":
            seconds *= 6;
            break;
        case "minute":
            seconds *= 60;
            break;
        case "hour":
            seconds *= 3600;
            break;
        case "day":
            seconds *= 28800;
            break; 
        default:
            return;
    }
    let hook = Hooks.on("fs-postSummon", async () => {
        const summons = game.canvas.tokens.placeables.filter(t => t.document.flags.summonId == args[0].item.id + '-' + args[0].itemCardId);
        console.error(summons);
        if (summons.length) {
            let changes = [];
            summons.forEach(s => { changes.push({ key: "flags.dae.deleteUuid", mode: 5, value: s.document.uuid, priority: "20" }) });
            const effectData = {
                changes: changes,
                label: args[0].item.name,
                icon: args[0].item.img,
                origin: args[0].item.uuid,
                disabled: false,
                duration: { seconds: seconds }
            }
            await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
            Hooks.off("fs.postSummon", hook);
        }
    });
} catch (err) {console.error("Summon Macro - ", err)}