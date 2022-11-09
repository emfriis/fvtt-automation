const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const token = canvas.tokens.get(lastArg.tokenId);

// ItemMacro beforeSave 

// beforeSave on save type save
if (args[0].tag === "OnUse" && lastArg.targetUuids.length > 0 && args[0].macroPass === "preSave") {
    for (let i = 0; i < lastArg.targetUuids.length; i++) {
        let tokenOrActorTarget = await fromUuid(lastArg.targetUuids[i]);
        let tactorTarget = tokenOrActorTarget.actor ? tokenOrActorTarget.actor : tokenOrActorTarget;
        if (tactor.token?.data?.disposition === tactorTarget.token?.data?.disposition) {
            const effectData = {
                changes: [
                    {
                        key: "data.bonuses.abilities.save",
                        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
                        value: -999,
                        priority: 20,
                    }
                ],
                disabled: false,
                flags: { dae: { specialDuration: ["isSave"] } },
                icon: args[0].item.img,
                label: `${args[0].item.name} Save Auto Fail`,
            };
            await tactorTarget.createEmbeddedDocuments("ActiveEffect", [effectData]);
        }
    }
}

async function reSize(flavour) {
    const originalSize = parseInt(token?.data?.width);
    const types = {
        enlarge: {
            size: originalSize + 1,
            bonus: "+1d4",
        },
        reduce: {
            size: originalSize > 1 ? originalSize - 1 : originalSize - 0.3,
            bonus: "-1d4",
        },
    };
    const changes = [
        {
            key: "data.bonuses.mwak.damage",
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            priority: 20,
            value: `${types[flavour].bonus}`,
        },
        {
            key: "ATL.width",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 30,
            value: `${types[flavour].size}`,
        },
        {
            key: "ATL.height",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 30,
            value: `${types[flavour].size}`,
        },
    ];
    const effect = tactor.effects.find((e) => e.data.label === lastArg.efData.label);
    if (effect) await effect.update({ changes: changes.concat(effect.data.changes) });
  }

if (args[0] === "on") {
    new Dialog({
        title: "Enlarge or Reduce",
        buttons: {
            one: {
                label: "Enlarge",
                callback: async () => await reSize("enlarge"),
            },
            two: {
                label: "Reduce",
                callback: async () => await reSize("reduce"),
            },
        },
    }).render(true);
}