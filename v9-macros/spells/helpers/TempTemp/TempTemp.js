    // temp temp
    // args[1] => @damage value of temp added

    const lastArg = args[args.length - 1];
    const tokenOrActor = await fromUuid(lastArg.actorUuid);
    const tactor = tokenOrActor.actor ?? tokenOrActor;

    
    if (args[0].tag === "OnUse" && args[0].macroPass === "preDamageApplication") {
        let tempAdd = 0;
        lastArg.damageDetail.forEach(async (d) => {
            if (d.type === "temphp") tempAdd += d.damage;
        });
        if (tempAdd > tactor.data.data.attributes.hp.temp) DAE.setFlag(tactor, "tempTempSource", lastArg.uuid);
    };

    if (args[0] === "on") {
        if (tactor.data.data.attributes.hp.temp === 0) {
            await tactor.update({ "data.attributes.hp.temp": args[1] });
        };
    };

    if (args[0] === "off") {
        console.warn(lastArg);
        let flag = await DAE.getFlag(tactor, "tempTempSource");
        if (flag && flag == lastArg.efData.origin) {
            await tactor.update({ "data.attributes.hp.temp": 0 });
        };
    };