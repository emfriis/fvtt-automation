// args in item activation condition - comma separated
// type/name/cr/amount groupings - question mark separated -> forward slash separated -> tilde separated -> underscore separated - i.e., name=boar,constrictor snake,cr=0.25,amount=4/name=giant boar|giant constrictor snake,cr=2/amount=1

try {
    if (args[0].tag != "OnUse" || args[0].macroPass != "postActiveEffects") return;
    const filters = args[0].item.system?.activation?.condition?.split("/");
    let summonFilters = [];
    let summonAmount = 1;
    let options = [];
    let expire = true;
    for (let f = 0; f < filters.length; f++) {
        const subFilters = filters[f]?.split(",");
        const filterDetails = { types: [], names: [], minCR: 0, maxCR: 0, amount: 1, content: "" };
        for (let s = 0; s < subFilters.length; s++) {
            const filter = subFilters[s]?.split("=");
            if (!filter || filter.length != 2) return ui.notifications.warn("Invalid Summon Filter Provided");
            const filterType = filter[0]?.trim()?.toLowerCase();
            const filterStrings = filter[1]?.split("|").map(s => s?.trim());
            switch (filterType) {
                case "type":
                    filterDetails.types = filterDetails.types.concat(filterStrings);
                    break;
                case "name":
                    filterDetails.names = filterDetails.names.concat(filterStrings);
                    break;
                case "cr":
                    const range = filterStrings[0]?.replace("damageRoll=","")?.replace(/@([^-+*^\/()@]+)(?=[-+*^\/()]|$)/g, i => i.replace("@","").split(".").reduce((val, prop) => { return val ? val[prop] : undefined }, args[0]));
                    const minCR = range[0]?.trim();
                    const maxCR = range[range.length - 1]?.trim();
                    if (isNaN(minCR) || isNaN(maxCR)) return ui.notifications.warn("Invalid CR range provided for summoning");
                    filterDetails.minCR = minCR;
                    filterDetails.maxCR = maxCR;
                    break;
                case "amount":
                    const amount = eval(filterStrings[0]?.replace(/@([^-+*^\/()@]+)(?=[-+*^\/()]|$)/g, i => i.replace("@","").split(".").reduce((val, prop) => { return val ? val[prop] : undefined }, args[0])));
                    if (isNaN(amount)) return ui.notifications.warn("Invalid amount provided for summoning");
                    filterDetails.amount = amount;
                    break;
                default:
                    return ui.notifications.warn("Invalid Summon Filter Provided");
            }
        }
        if ((!filterDetails.types.length && !filterDetails.names.length) || (filterDetails.types.length && filterDetails.names.length)) return ui.notifications.warn("3Invalid Summon Filter Provided");
        const typesOrNames = filterDetails.types.length ? filterDetails.types : filterDetails.names;
        let typesOrNamesContent = "";
        for (let c = 0; c < typesOrNames.length; c++) {
            typesOrNamesContent += `${c > 0 ? "or" : ""} ${typesOrNames[c].split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}${filterDetails.amount > 1 ? "s" : ""}`;
        }
        filterDetails.content = `${filterDetails.amount} ${typesOrNamesContent} of CR ${filterDetails.minCR == filterDetails.maxCR ? filterDetails.minCR : filterDetails.minCR + "-" + filterDetails.maxCR}`;
        options.push(filterDetails);
    }
    console.error(options);
    let summonContent = ";"
    for (let o = 0; o < options.length; o++) {
        summonContent += `<label class="radio-label"><br><input type="radio" name="summon" value="${o}">${options[o].content}</label>`;
    }
    let content = `
        <style>
        .summon .form-group {display: flex; flex-wrap: wrap; width: 100%; align-items: flex-start;}
        .summon .radio-label { display: flex; flex-direction: column; align-items: center; text-align: center; justify-items: center; flex: 1 0 25%; line-height: normal;}
        .summon .radio-label input {display: none;}
        .summon img {border: 0px; width: 50px; height: 50px; flex: 0 0 50px; cursor: pointer;}
        </style>
        <form class="summon">
            <div class="form-group" id="summons">${summonContent}</div>
        </form>
    `;
    let dialog = new Promise(async (resolve) => {
        new Dialog({
            title: `${args[0].item.name}: Usage Configuration`,
            content,
            buttons: {
                Confirm: {
                    label: "Confirm",
                    callback: async () => {
                        let summon = $("input[type='radio'][name='summon']:checked").val();
                        resolve(summon);
                    },
                },
                Cancel: {
                    label: "Cancel",
                    callback: async () => {
                        resolve(false);
                    },
                },
            },
            default: "Cancel",
            close: async () => { resolve(false) },
        }).render(true);
    });
    let summon = await dialog;
    if (!summon) return;
    console.error(options[summon])
    if (options[summon].types) summonFilters.push({ name: `Creature Types: ${options[summon].types.join(", ")}`, locked: true, function: (index) => { return index.filter(i => options[summon].types.find(s => i.system.details?.type?.value?.toLowerCase().includes(s?.toLowerCase()) || i.system.details?.race?.toLowerCase().includes(s.toLowerCase()))) } });
    if (options[summon].names) summonFilters.push({ name: `Names: ${filterStrings.join(", ")}`, locked: true, function: (index) => { return index.filter(i => filterStrings.find(s => i.name.trim().toLowerCase() == s?.toLowerCase())) } });
    summonFilters.push({ name: `Challenge Ratings: ${minCR}-${maxCR}`, locked: true, function: (index) => { return index.filter(i => i.system.details?.cr >= minCR && i.system.details?.cr <= maxCR) } });
    summonAmount = options[summon].amount;
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