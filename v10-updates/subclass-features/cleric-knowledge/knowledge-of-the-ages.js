try {
    if (args[0].macroPass == "postActiveEffects") {
        const options = Object.entries(CONFIG.DND5E.skills).map(s => { return { name: s[1].label, value: `system.skills.${s[0]}.value`, prof: args[0].actor.system.skills[s[0]]?.value } }).concat([  
            { name: "Alchemist's Supplies", value: "system.tools.alchemist.prof", prof: args[0].actor.system.tools.alchemist?.prof }, 
            { name: "Bagpipes", value: "system.tools.bagpipes.prof", prof: args[0].actor.system.tools.bagpipes?.prof },
            { name: "Brewer's Supplies", value: "system.tools.brewer.prof", prof: args[0].actor.system.tools.brewer?.prof },
            { name: "Calligrapher's Supplies", value: "system.tools.calligrapher.prof", prof: args[0].actor.system.tools.calligrapher?.prof },
            { name: "Playing Cards Set", value: "system.tools.card.prof", prof: args[0].actor.system.tools.card?.prof },
            { name: "Carpenter's Tools", value: "system.tools.carpenter.prof", prof: args[0].actor.system.tools.carpenter?.prof },
            { name: "Cartographer's Tools", value: "system.tools.cartographer.prof", prof: args[0].actor.system.tools.cartographer?.prof },
            { name: "Chess Set", value: "system.tools.chess.prof", prof: args[0].actor.system.tools.chess?.prof },
            { name: "Cobbler's Tools", value: "system.tools.cobbler.prof", prof: args[0].actor.system.tools.cobbler?.prof },
            { name: "Cook's Utensils", value: "system.tools.cook.prof", prof: args[0].actor.system.tools.cook?.prof },
            { name: "Dice Set", value: "system.tools.dice.prof", prof: args[0].actor.system.tools.dice?.prof },
            { name: "Disguise Kit", value: "system.tools.disg.prof", prof: args[0].actor.system.tools.disg?.prof },
            { name: "Drum", value: "system.tools.drum.prof", prof: args[0].actor.system.tools.drum?.prof },
            { name: "Dulcimer", value: "system.tools.dulcimer.prof", prof: args[0].actor.system.tools.dulcimer?.prof },
            { name: "Flute", value: "system.tools.flute.prof", prof: args[0].actor.system.tools.flute?.prof },
            { name: "Forgery Kit", value: "system.tools.forg.prof", prof: args[0].actor.system.tools.forg?.prof },
            { name: "Glassblower's Tools", value: "system.tools.glassblower.prof", prof: args[0].actor.system.tools.glassblower?.prof },
            { name: "Herbalism Kit", value: "system.tools.herb.prof", prof: args[0].actor.system.tools.herb?.prof },
            { name: "Horn", value: "system.tools.horn.prof", prof: args[0].actor.system.tools.horn?.prof },
            { name: "Jeweler's Tools", value: "system.tools.jeweler.prof", prof: args[0].actor.system.tools.jeweler?.prof },
            { name: "Leatherworker's Tools", value: "system.tools.leatherworker.prof", prof: args[0].actor.system.tools.leatherworker?.prof },
            { name: "Lute", value: "system.tools.lute.prof", prof: args[0].actor.system.tools.lute?.prof },
            { name: "Lyre", value: "system.tools.lyre.prof", prof: args[0].actor.system.tools.lyre?.prof },
            { name: "Mason's Tools", value: "system.tools.mason.prof", prof: args[0].actor.system.tools.mason?.prof },
            { name: "Navigator's Tools", value: "system.tools.navg.prof", prof: args[0].actor.system.tools.navg?.prof },
            { name: "Painter's Supplies", value: "system.tools.painter.prof", prof: args[0].actor.system.tools.painter?.prof },
            { name: "Panflute", value: "system.tools.panflute.prof", prof: args[0].actor.system.tools.panflute?.prof },
            { name: "Poisoner's Kit", value: "system.tools.pois.prof", prof: args[0].actor.system.tools.pois?.prof },
            { name: "Potter's Tools", value: "system.tools.potter.prof", prof: args[0].actor.system.tools.potter?.prof },
            { name: "Shawm", value: "system.tools.shawm.prof", prof: args[0].actor.system.tools.shawm?.prof },
            { name: "Smith's Tools", value: "system.tools.smith.prof", prof: args[0].actor.system.tools.smith?.prof },
            { name: "Thieves' Tools", value: "system.tools.thief.prof", prof: args[0].actor.system.tools.thief?.prof },
            { name: "Tinker's Tools", value: "system.tools.tinker.prof", prof: args[0].actor.system.tools.tinker?.prof },
            { name: "Vehicle (Air)", value: "system.tools.air.prof", prof: args[0].actor.system.tools.air?.prof },
            { name: "Vehicle (Land)", value: "system.tools.land.prof", prof: args[0].actor.system.tools.land?.prof },
            { name: "Vehicle (Space)", value: "system.tools.space.prof", prof: args[0].actor.system.tools.space?.prof },
            { name: "Vehicle (Water)", value: "system.tools.water.prof", prof: args[0].actor.system.tools.water?.prof },
            { name: "Viol", value: "system.tools.viol.prof", prof: args[0].actor.system.tools.viol?.prof },
            { name: "Weaver's Tools", value: "system.tools.weaver.prof", prof: args[0].actor.system.tools.weaver?.prof },
            { name: "Woodcarver's Tools", value: "system.tools.woodcarver.prof", prof: args[0].actor.system.tools.woodcarver?.prof }
        ]).filter(p => !p.prof || p.prof == 3);
        const optionContent = options.map((o) => { return `<option value="${o.value}">${o.name}</option>` });
        let dialog = new Promise((resolve,) => {
            new Dialog({
                title: "Knowledge of the Ages: Choose a Tool/Skill",
                content: `<div><label>Damage Types: </label><select name="profs"}>${optionContent}</select></div>`,
                buttons: {
                    Confirm: {
                        label: "Confirm",
                        callback: () => {resolve($("[name=profs]")[0].value)},
                    },
                    Cancel: {
                        label: "Cancel",
                        callback: () => {resolve(false)},
                    },
                },
                default: "Cancel",
                close: () => {resolve(false)}
            }).render(true);
        });
        let prof = await dialog;
        if (!prof) return;
        const effectData = {
            name: "Channel Divinity: Knowledge of the Ages",
            icon: "icons/tools/navigation/compass-plain-blue.webp",
            changes: [{ key: prof, mode: 0, value: "1", priority: 20 }],
            disabled: false,
            duration: { seconds: 600 }
        }
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: args[0].actor.uuid, effects: [effectData] });
    }
} catch (err) {console.error("Knowledge of the Ages Macro - ", err)}