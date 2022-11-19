const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.actorUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;
const token = canvas.tokens.get(lastArg.tokenId);

if (args[0] === "on") {
    const originalSize = parseInt(token?.data?.width);
    if (originalSize === 1) return;
    const changes = [
        {
            key: "ATL.height",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 30,
            value: `${originalSize - 1}`,
        },
        {
            key: "ATL.width",
            mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
            priority: 30,
            value: `${originalSize - 1}`,
        },
    ];
    const effect = tactor.effects.find((e) => e.data.label === lastArg.efData.label);
    if (effect) await effect.update({ changes: changes.concat(effect.data.changes) });
}

if (args[0].tag === "OnUse" && ["mwak","rwak"].includes(args[0].itemData.data.actionType)) {
    const attackWorkflow = MidiQOL.Workflow.getWorkflow(args[0].uuid);
    const parts = attackWorkflow.item.data.data.damage.parts;
    if (parts.length > 0) {
        attackWorkflow.item.data.data.damage.parts = [["1", attackWorkflow.item.data.data.damage.parts[0][1]]];
        let hook = Hooks.on("midi-qol.RollComplete", async workflowNext => {
            if (workflowNext.uuid === args[0].uuid) {
                const workflowItem = await fromUuid(attackWorkflow.item.uuid);
                workflowItem.update({ "data.data.damage.parts" : parts });
                Hooks.off("midi-qol.RollComplete", hook);
            }
        });
    }
}