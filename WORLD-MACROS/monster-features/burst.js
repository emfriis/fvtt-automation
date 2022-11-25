// burst world macro
// flag syntax range(int[range]),damageDice(str[rollable]),damageType(str[damage]),saveDC(str["none"] or int[dc]),saveType(str["none" or abil]),saveDamage(str["none" or "nodam" or "halfdam"]),magicEffect(str["none" or "magiceffect"])

if (!game.modules.get("midi-qol")?.active) throw new Error("requisite module(s) missing");

async function applyDamage(actor, range, damageDice, damageType, saveDC, saveType, saveDamage, magicEffect) {
    const itemData = {
        name: `${damageType.charAt(0).toUpperCase() + damageType.slice(1)} Burst`,
        img: "systems/dnd5e/icons/skills/yellow_15.jpg",
        type: "feat",
        "flags.midiProperties": {
            magiceffect: (magicEffect === "magiceffect"),
            nodam: (saveDamage === "nodam"),
            halfdam: (saveDamage === "halfdam")
        },
        data: {
            "activation.type": "none",
            actionType: (saveDC === "none" ? "other" : "save"),
            damage: { parts: [[damageDice, damageType]] },
            save: { dc: (saveDC === "none" ? null : parseInt(saveDC)), ability: (saveType === "none" ? null : saveType), scaling: "flat" },
            target: { value: range, width: null, units: "feet", type: "creature" },
            range:{ value: null, long: null, units: "special" }
        }
    }
    const item = new CONFIG.Item.documentClass(itemData, { parent: actor });
    const options = { showFullCard: false, createWorkflow: true, configureDialog: false };
    await MidiQOL.completeItemRoll(item, options);
};

Hooks.on("midi-qol.RollComplete", async (workflow) => {
    try {
        if (!workflow?.actor) return;
        ui.notifications.warn(0);
        workflow?.damageList.forEach(async (d) => {
            const actor = await fromUuid(d.actorUuid);
            if (!actor || !actor.data.flags["midi-qol"]?.burst) return;
            ui.notifications.warn(1);
            if (d.oldHP !== 0 && d.newHP === 0 && actor.data.data.attributes.hp.value === 0) {
                ui.notifications.warn(2);
                const burst = actor.data.flags["midi-qol"].burst.split(",");
                await applyDamage(actor, burst[0], burst[1], burst[2], burst[3], burst[4], burst[5], burst[6]);
            }
        });
    } catch(err) {
        console.error(`burst macro error`, err);
    }
});