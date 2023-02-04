// revive
// on use pre effects

if (args[0].tag !== "OnUse") return;
for (let t = 0; t < args[0].targets.length; t++) {
    let target = args[0].targets[t];
    let tactor = target?.actor;
    if (!tactor || tactor.data.data.attributes.hp.value || !tactor.effects.find(e => e.data.label === "Dead")) return;
    await USF.socket.executeAsGM("updateActor", { actorUuid: tactor.uuid, updates: {"data.attributes.hp.value" : 1} });
} 