// magic stone

const lastArg = args[args.length - 1];
const tokenOrActor = await fromUuid(lastArg.tokenUuid);
const tactor = tokenOrActor.actor ? tokenOrActor.actor : tokenOrActor;

const attackBonus = tactor.data.data.abilities[tactor.data.data.attributes.spellcasting ?? "int"].mod + tactor.data.data.attributes.prof;
const damageBonus = tactor.data.data.abilities[tactor.data.data.attributes.spellcasting ?? "int"].mod;

if (args[0] === "on") {
    const flag = `${tactor.uuid}MagicStone${tactor.effects.filter(e => e.data.label === "Magic Stone").length}Time${game.world.time}`;
    let itemData = [{
        "name": `Stone (${lastArg.efData.label})`,
        "type": "weapon",
        "img": lastArg.efData.icon,
        flags: { magicStone: flag },
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
            "attackBonus": `${attackBonus} - @mod`,
            "damage": {
                "parts": [
                    [
                        `1d6 + ${damageBonus} - @mod[bludgeoning]`,
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
	const effect = tactor.effects.find(e => e.data === lastArg.efData);
    await effect.update({ "flags.magicStone": flag });
}

if (args[0] === "off") {
    game.actors.forEach(actor => {
        actor.items.forEach(item => {
            if (!item.data.flags.magicStone || item.data.flags.magicStone !== lastArg.efData.flags.magicStone) return;
            USF.socket.executeAsGM("deleteItem", { itemUuid: item.uuid });
        });
    });
}