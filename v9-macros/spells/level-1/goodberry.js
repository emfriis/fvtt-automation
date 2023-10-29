// goodberry

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "on") {
    const flag = `${tactor.uuid}Goodberry${tactor.effects.filter(e => e.data.label === "Goodberry").length}Time${game.world.time}`;
    await tactor.createEmbeddedDocuments("Item", [{
        name: "Goodberry",
        type: "consumable",
        img: "icons/commodities/flowers/buds-black-red.webp",
        flags: { goodberry: flag },
        data: {
			activation: { type: "action", cost: 1, },
			target: { value: null, width: null, units: null, type: "creature", },
			range: { value: null, long: null, units: "touch", },
            description: { value: "Its a goodberry.", },
            quantity: 10,
            uses: { value: 1, max: 1, per: "charges", autoDestroy: true },
			actionType: "heal",
            damage: { parts: [["1[healing]", "healing"]], versatile: "" },
            consumableType: "food"
        },
    }]);
    const effect = tactor.effects.find(e => e.data === lastArg.efData);
    await effect.update({ "flags.goodberry": flag });
}

if (args[0] === "off") {
    game.actors.forEach(actor => {
        actor.items.forEach(item => {
            if (!item.data.flags.goodberry || item.data.flags.goodberry !== lastArg.efData.flags.goodberry) return;
            USF.socket.executeAsGM("deleteItem", { itemUuid: item.uuid });
        });
    });
}