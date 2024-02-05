// args in item activation condition - comma separated
// type = creature types - breakline separated - i.e., type=construct|undead
// name = creature name - breakline separated i.e., name=skeleton|zombie
// cr = cr range - min and max dash separated or single value - i.e., cr=0-1
// amount = amount to summon default 1 - i.e., amount=1
// expire = whether summon should expire at end of spell duration default true - i.e., expire=true
// option = type/name/cr/amount groupings - question mark separated -> forward slash separated -> tilde separated -> underscore separated - i.e., option=type~beast/name~boar_constrictor snake/cr~0.25/amount~4?type~beast/name~giant boar_giant constrictor snake/cr~2/amount~4

try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects") return;
    const filters = args[0].item.system?.activation?.condition?.split(",");
    let summonFilters = [];
    let summonAmount = 1;
    let expire = true;
    for (let f = 0; f < filters.length; f++) {
        const filter = filters[f]?.split("=");
        if (!filter || filter.length != 2) return ui.notifications.warn("Invalid Summon Filter Provided");
        const filterType = filter[0]?.trim()?.toLowerCase();
        const filterStrings = filter[1]?.split("|").map(s => s?.trim());
        switch (filterType) {
            case "type":
                summonFilters.push({ name: `Creature Types: ${filterStrings.join(", ")}`, locked: true, function: (index) => { return index.filter(i => filterStrings.find(s => i.system.details?.type?.value?.toLowerCase().includes(s?.toLowerCase()) || i.system.details?.race?.toLowerCase().includes(s.toLowerCase()))) } });
                break;
            case "name":
                summonFilters.push({ name: `Names: ${filterStrings.join(", ")}`, locked: true, function: (index) => { return index.filter(i => filterStrings.find(s => i.name.trim().toLowerCase() == s?.toLowerCase())) } });
                break;
            case "cr":
                const range = filterStrings[0]?.replace("damageRoll=","")?.replace(/@([^-+*^\/()@]+)(?=[-+*^\/()]|$)/g, i => i.replace("@","").split(".").reduce((val, prop) => { return val ? val[prop] : undefined }, args[0]));
                const minCR = +range[0]?.trim();
                const maxCR = +range[range.length - 1]?.trim();
                if (isNaN(minCR) || isNaN(maxCR)) return ui.notifications.warn("Invalid CR range provided for summoning");
                summonFilters.push({ name: `Challenge Ratings: ${minCR}-${maxCR}`, locked: true, function: (index) => { return index.filter(i => i.system.details?.cr >= minCR && i.system.details?.cr <= maxCR) } });
                break;
            case "amount":
                summonAmount = eval(filterStrings[0]?.replace(/@([^-+*^\/()@]+)(?=[-+*^\/()]|$)/g, i => i.replace("@","").split(".").reduce((val, prop) => { return val ? val[prop] : undefined }, args[0])));
                if (isNaN(summonAmount)) return ui.notifications.warn("Invalid amount provided for summoning");
                break;
            case "expire":
                if (filterStrings[0]?.toLowerCase() == "false") expire = false;
                break;
            case "option":
                let optionContent = "";
                const optionFilters = filterStrings?.split("?");
                for (let f = 0; f < optionFilters.length; f++) {
                    const optionDetails = { types: [], names: [], minCR: 0, maxCR: 0, amount: 0 }
                    const optionSubFilters = optionFilters[f]?.split("/");
                    for (let s = 0; s < optionSubFilters.length; s++) {

                    }

                    if (!optionFilter || optionFilter.length != 2) return ui.notifications.warn("Invalid Summon Filter Provided");
                    const optionFilterType = optionFilter[0]?.trim()?.toLowerCase();
                    const optionFilterStrings = optionFilter[1]?.split("/").map(s => s?.trim());



                    switch (filterType) {
                        case "type":
                            summonFilters.push({ name: `Creature Types: ${filterStrings.join(", ")}`, locked: true, function: (index) => { return index.filter(i => filterStrings.find(s => i.system.details?.type?.value?.toLowerCase().includes(s?.toLowerCase()) || i.system.details?.race?.toLowerCase().includes(s.toLowerCase()))) } });
                            break;
                        default:
                            return ui.notifications.warn("Invalid Summon Filter Provided");
                    }
                }
            default:
                return ui.notifications.warn("Invalid Summon Filter Provided");
        }
    }
    const summonId = args[0].item._id + '-' + args[0].itemCardId;
    const summons = await foundrySummons.openMenu({ sourceTokens: [args[0].workflow.token], filters: summonFilters, amount: { value: summonAmount, locked: true }, updates: { actor: { permissions: { [game.user._id]: 3 } }, token: { disposition: args[0].workflow.token.document.disposition, flags: { "midi-qol": { summonId: summonId, parentUuid: args[0].actor.uuid } } } }, options: { autoPick: true, defaultFilters: true, defaultSorting: true } });
    const duration = args[0].item.system.duration;
    if (!summons.tokenIds?.length) return console.warn("No Summons - Aborting Macro");
    if (expire && duration.value && ["round", "minute", "hour", "day"].includes(duration.units)) {
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
        let changes = [];
        summons.tokenIds.forEach(t => { 
            let token = canvas.tokens.get(t);
            changes.push({ key: "flags.dae.deleteUuid", mode: 5, value: token.document.uuid, priority: "20" }); 
        });
        const effectData = {
            name: args[0].item.name,
            icon: args[0].item.img,
            origin: args[0].item.uuid,
            disabled: false,
            duration: { seconds: seconds },
            flags: { "midi-qol.summonId": summonId },
            changes: changes
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    }
    Hooks.call("summonComplete", summonId, summons);
} catch (err) {console.error("Summon Anything Macro - ", err)}