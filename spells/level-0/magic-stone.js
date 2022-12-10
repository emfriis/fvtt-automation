// magic stone

const lastArg = args[args.length - 1];
console.log(lastArg);
let tactor;
if (lastArg.tokenId) tactor = canvas.tokens.get(lastArg.tokenId).actor;
else tactor = game.actors.get(lastArg.actorId);
const itemD = lastArg.efData.flags.dae.itemData;
const atkMod = Number(args[1]) + Number(args[2]);
const dmgMod = Number(args[1]);

if (args[0] === "on") {
    let itemData = [{
        "name": `Stone (${itemD.name})`,
        "type": "weapon",
        "img": itemD.img,
        "data": {
            "description": {
                "value": "<p>A magically imbued stone.</p>",
                "chat": "",
                "unidentified": ""
            },
            "quantity": 3,
            "equipped": true,
            "identified": true,
            "activation": {
                "type": "action",
                "cost": 1,
                "condition": ""
            },
            "range": {
                "value": 60,
                "long": null,
                "units": "ft"
            },
            "uses": {
                "value": 1,
                "max": 1,
                "per": "charges",
                "autoDestroy": true
            },
            "actionType": "rsak",
            "attackBonus": `${atkMod} - @mod`,
            "damage": {
                "parts": [
                    [
                        `1d6 + ${dmgMod} - @mod[bludgeoning]`,
                        "bludgeoning"
                    ]
                ],
                "versatile": ""
            },
			"weaponType": "natural",
            "properties": {
                "mgc": true,
                "thr": true
            },
            "proficient": false,
        }
    }];
    await tactor.createEmbeddedDocuments("Item", itemData);
	ui.notifications.notify("You imbue 3 stones with magical force")
}

if (args[0] === "off") {
    let items = tactor.data.items.find(i => i.name === `Stone (${itemD.name})` && i.type === "weapon");
    if (items) await tactor.deleteEmbeddedDocuments('Item', [items.id]);
	ui.notifications.notify("The stones' magic fades")
}