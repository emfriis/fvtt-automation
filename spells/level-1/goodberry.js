// goodberry

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

if (args[0] === "on") {
    await tactor.createEmbeddedDocuments("Item", [{
        name: "Goodberry",
        type: "consumable",
        img: "icons/commodities/flowers/buds-black-red.webp",
        flags: { goodberry: `${lastArg.actorUuid}` },
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
}

if (args[0] === "off") {
    game.actors.forEach(actor => {
        actor.items.forEach(item => {
            if (!item.data.flags.goodberry || item.data.flags.goodberry !== lastArg.actorUuid) return;
            USF.socket.executeAsGM("deleteItem", { itemUuid: item.uuid });
        });
    });
}