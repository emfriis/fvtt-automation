// goodberry

const lastArg = args[args.length - 1];
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
let healing = 1;
if (tactor.items.find(i => ["Disciple of Life"].includes(i.name))) healing += 2 + args[1];

if (args[0] === "on") {
    ui.notifications.notify("A batch of goodberries has been placed in your inventory")

    await tactor.createEmbeddedDocuments("Item", [{
        name: "Goodberries",
        type: "consumable",
        data: {
			activation: { 
				type: "action",
				cost: 1,			
			},
			target: { 
				value: 1, 
				width: null, 
				units: null, 
				type: "creature", },
			range: {
				value: null,
				long: null,
				units: "touch", },
            description: {
                value: "Its a goodberry",
            },
            quantity: 10,
            uses: {
                value: 1,
                max: 1,
                per: "charges",
                autoDestroy: true
            },
			actionType: "heal",
            damage: {
                parts: [
                    [
                        healing,
                        "healing"
                    ]
                ],
                versatile: ""
            },
            consumableType: "food"
        },
        img: "icons/commodities/flowers/buds-black-red.webp",
    }])
}

if (args[0] === "off") {
    let removeItem = tactor.items.find(i => i.name === "Goodberries")
    if (removeItem) {
        await tactor.deleteEmbeddedDocuments('Item', [removeItem.id]);
	ui.notifications.notify("The batch of goodberries expire");
    }
}